import { LitElement, property, html, css, query } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { ApolloClient, gql } from 'apollo-boost';

import '@authentic/mwc-card';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { AccessControlService, OwnerPermissions, SET_PUBLIC_READ } from '@uprtcl/access-control';
import { CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import { DiscoveryModule, EntityCache, loadEntity } from '@uprtcl/multiplatform';

import {
  RemoteMap,
  ProposalCreatedEvent,
  Perspective,
  PerspectiveDetails,
  Commit,
  NewPerspectiveData
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesModule } from '../evees.module';
import {
  UPDATE_HEAD,
  AUTHORIZE_PROPOSAL,
  EXECUTE_PROPOSAL,
  DELETE_PERSPECTIVE,
  CREATE_AND_ADD_PROPOSAL,
  getPerspectiveHead,
  getPerspectiveAuthority
} from '../graphql/queries';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees } from '../services/evees';

import { executeActions, cacheActions } from '../utils/actions';
import { EveesRemote } from 'src/uprtcl-evees';

import { EveesDialog } from './common-ui/evees-dialog';
import { EveesWorkspace } from 'src/services/evees.workspace';
import { EveesDiff } from './evees-diff';

interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  canWrite: Boolean;
  permissions: any;
  head: Entity<Commit>;
  data: Entity<any>;
}

export class EveesInfoBase extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: String, attribute: 'default-authority'})
  defaultAuthority: string | undefined = undefined;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ attribute: false })
  loading: Boolean = false;

  @property({ attribute: false })
  activeTabIndex: number = 0;

  @property({ attribute: false })
  publicRead: boolean = true;

  @property({ attribute: false })
  isLogged: boolean = false;

  @property({ attribute: false })
  forceUpdate: string = 'true';

  @property({ attribute: false})
  showUpdatesDialog: boolean = false;

  @property({ attribute: false })
  firstHasChanges!: boolean;

  @query('#updates-dialog')
  updatesDialogEl!: EveesDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;
  

  dialogConfig: any = {};
  
  perspectiveData!: PerspectiveData;

  protected client!: ApolloClient<any>;
  protected merge!: MergeStrategy;
  protected evees!: Evees;
  protected recognizer!: PatternRecognizer;
  protected cache!: EntityCache;
  protected remoteMap!: RemoteMap;
  protected defaultRemote: EveesRemote | undefined = undefined;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.merge = this.request(EveesBindings.MergeStrategy);
    this.evees = this.request(EveesModule.bindings.Evees);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.cache = this.request(DiscoveryModule.bindings.EntityCache);
    this.remoteMap = this.request(EveesModule.bindings.RemoteMap);

    if (this.defaultAuthority !== undefined) {
      this.defaultRemote = (this.requestAll(EveesModule.bindings.EveesRemote) as EveesRemote[]).find(remote => remote.authority === this.defaultAuthority);
    }

    this.load();
  }
  
  updated(changedProperties) {
    if (changedProperties.get('perspectiveId') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }
  }
  
  async load() {
    if (!this.client) throw new Error('client undefined');

    this.loading = true;
    const result = await this.client.query({
      query: gql`
        {
          entity(ref: "${this.perspectiveId}") {
            id
            ... on Perspective {
              context {
                id
              }
              head {
                id
                ... on Commit {
                  data {
                    id
                  }
                }
              }
              name
              payload {
                authority
                creatorId
                timestamp
              }
            }
            _context {
              patterns {
                accessControl {
                  canWrite
                  permissions
                }
              }
            }
          }
        }
      `
    });

    const accessControl = result.data.entity._context.patterns.accessControl;
    const data = await loadEntity(this.client, result.data.entity.head.data.id);
    const head = await loadEntity(this.client, result.data.entity.head.id) as Entity<Commit>;

    if (!data) throw new Error('data undefined');
    if (!head) throw new Error('head undefined');

    this.perspectiveData = {
      id: result.data.entity.id,
      details: {
        context: result.data.entity.context.id,
        headId: result.data.entity.head.id,
        name: result.data.entity.name
      },
      perspective: result.data.entity.payload,
      canWrite: accessControl ? accessControl.canWrite : true,
      permissions: accessControl ? accessControl.permissions : undefined,
      head,
      data
    };

    this.publicRead = this.perspectiveData.permissions.publicRead !== undefined ? this.perspectiveData.permissions.publicRead : true;
  
    this.logger.info('load', { perspectiveData: this.perspectiveData });
    this.isLogged = this.defaultRemote !== undefined ? (this.defaultRemote.userId !== undefined) : false;

    this.reload();
    this.loading = false;

    this.checkPull();
  }

  async checkPull() {
    if((this.perspectiveId === this.firstPerspectiveId)
      || (!this.perspectiveData.canWrite)) {

      this.firstHasChanges = false;
      return;
    }
    
    const remote = await this.evees.getPerspectiveProviderById(this.perspectiveId);

    const config = {
      forceOwner: true,
      authority: this.perspectiveData.perspective.authority,
      canWrite: remote.userId
    };

    const workspace = new EveesWorkspace(this.recognizer, this.client);

    await this.merge.mergePerspectivesExternal(
      this.perspectiveId,
      this.firstPerspectiveId,
      config,
      workspace
    );

    this.logger.info('checkPull()');
    this.firstHasChanges = workspace.hasUpdates();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('permissions-updated', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: permissions-updated ', {
        perspectiveId: this.perspectiveId,
        e
      });
      e.stopPropagation();
      this.load();
    }) as EventListener);
  }

  reload() {
    if (this.forceUpdate === 'true') {
      this.forceUpdate = 'false';
    } else {
      this.forceUpdate = 'true';
    }
  }

  otherPerspectiveClicked(perspectiveId: string) {
    this.logger.info(`otherPerspectiveClicked() ${perspectiveId}`);
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          perspectiveId: perspectiveId
        }
      })
    );
  }

  async login() {
    if (this.defaultRemote === undefined) throw new Error('default remote undefined');
    await this.defaultRemote.login();

    await this.client.resetStore();
    this.reload();
    this.load();
  }

  async logout() {
    if (this.defaultRemote === undefined) throw new Error('default remote undefined');
    await this.defaultRemote.logout();

    await this.client.resetStore();
    this.reload();
    this.load();
  }

  async makePublic() {
    if(!this.client) throw new Error('client undefined');
    await this.client.mutate({
      mutation: SET_PUBLIC_READ,
      variables: {
        entityId: this.perspectiveId,
        value: true
      }
    });

    this.load();
  }

  async otherPerspectiveMerge(fromPerspectiveId: string, toPerspectiveId: string, isProposal: boolean) {
    this.logger.info(
      `merge ${fromPerspectiveId} on ${toPerspectiveId} - isProposal: ${isProposal}`
    );

    const remote = await this.evees.getPerspectiveProviderById(toPerspectiveId);

    const accessControl = remote.accessControl as AccessControlService<OwnerPermissions>;
    const permissions = await accessControl.getPermissions(toPerspectiveId);

    if (permissions === undefined)
      throw new Error('target perspective dont have permissions control');

    if (!permissions.owner) {
      // TODO: ownerPreserving merge should be changed to permissionPreserving merge
      throw new Error(
        'Target perspective dont have an owner. TODO: ownerPreserving merge should be changed to permissionPreserving merge'
      );
    }

    const workspace = new EveesWorkspace(this.recognizer, this.client);

    const config = {
      forceOwner: true,
      authority: remote.authority,
      canWrite: permissions.owner
    };

    await this.merge.mergePerspectivesExternal(
      toPerspectiveId,
      fromPerspectiveId,
      config,
      workspace
    );

    const confirm = await this.updatesDialog(workspace, 'propose', 'cancel');

    if (!confirm) {
      return;
    };

    const toHeadId = await getPerspectiveHead(this.client, toPerspectiveId);
    const fromHeadId = await getPerspectiveHead(this.client, fromPerspectiveId);
    
    if (isProposal) {
      await this.createMergeProposal(fromPerspectiveId, toPerspectiveId, fromHeadId, toHeadId, workspace);
    } else {
      await this.applyMerge(workspace);
    }

    if (this.perspectiveId !== toPerspectiveId) {
      this.otherPerspectiveClicked(toPerspectiveId);
    } else {
      /** reload perspectives-list */
      this.reload();
    }
  }

  async applyMerge(workspace: EveesWorkspace): Promise<void> {
    
    await workspace.execute(this.client);

    const update = workspace.updates.map(async (update) => {
      return this.client.mutate({
        mutation: UPDATE_HEAD,
        variables: {
          perspectiveId: update.perspectiveId,
          headId: update.newHeadId
        }
      });
    });

    await Promise.all(update);
  }

  async createMergeProposal(
    fromPerspectiveId: string, 
    toPerspectiveId: string, 
    fromHeadId: string, 
    toHeadId: string, 
    workspace: EveesWorkspace): Promise<void> {

    // TODO: handle proposals and updates on multiple authorities.
    const authority = await getPerspectiveAuthority(this.client, toPerspectiveId);
    
    const not = await workspace.isSingleAuthority(authority);
    if (!not) throw new Error('cant create merge proposals on multiple authorities yet');

    /** create commits and data */
    await workspace.executeCreate(this.client);

    const proposal = {
      toPerspectiveId, 
      fromPerspectiveId, 
      toHeadId,
      fromHeadId,
      updates: workspace.updates
    };

    const result = await this.client.mutate({
      mutation: CREATE_AND_ADD_PROPOSAL,
      variables: {
        perspectives: workspace.newPerspectives,
        proposal: proposal
      }
    });

    const proposalId = result.data.createAndAddProposal.id;

    this.logger.info('created proposal');

    this.dispatchEvent(
      new ProposalCreatedEvent({
        detail: { proposalId, authority },
        cancelable: true,
        composed: true,
        bubbles: true
      })
    );
    
  }

  async authorizeProposal(e: CustomEvent) {
    if (!this.client) throw new Error('client undefined');

    const proposalId = e.detail.proposalId;
    const perspectiveId = e.detail.perspectiveId;
    const result = await this.client.mutate({
      mutation: AUTHORIZE_PROPOSAL,
      variables: {
        proposalId: proposalId,
        perspectiveId: perspectiveId,
        authorize: true
      }
    });

    this.logger.info('accepted proposal', { proposalId });

    this.reload();
  }

  async executeProposal(e: CustomEvent) {
    if (!this.client) throw new Error('client undefined');

    const proposalId = e.detail.proposalId;
    const perspectiveId = e.detail.perspectiveId;

    const result = await this.client.mutate({
      mutation: EXECUTE_PROPOSAL,
      variables: {
        proposalId: proposalId,
        perspectiveId: perspectiveId
      }
    });

    this.logger.info('accepted proposal', { proposalId });

    this.dispatchEvent(
      new CustomEvent('refresh-content', {
        cancelable: true,
        composed: true,
        bubbles: true
      })
    );

    this.reload();
  }

  async newPerspectiveClicked() {

    this.loading = true;

    const forkPerspective = await this.evees.forkPerspective(this.perspectiveId, this.defaultAuthority);

    await cacheActions(forkPerspective.actions, this.cache, this.client);
    await executeActions(forkPerspective.actions, this.client);

    this.checkoutPerspective(forkPerspective.new);

    this.logger.info('newPerspectiveClicked() - perspective created', { id: forkPerspective.new });
  }

  checkoutPerspective(perspectiveId: string) {
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: perspectiveId
        },
        composed: true,
        bubbles: true
      })
    );
  }

  async proposeMergeClicked() {
    await this.otherPerspectiveMerge(this.perspectiveId, this.firstPerspectiveId, true);
  }

  perspectiveTextColor() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return '#37352f';
    } else {
      return '#ffffff';
    }
  }

  async delete() {
    if (!this.client) throw new Error('client undefined');

    await this.client.mutate({
      mutation: DELETE_PERSPECTIVE,
      variables: {
        perspectiveId: this.perspectiveId
      }
    });

    this.checkoutPerspective(this.firstPerspectiveId);
  }

  async updatesDialog(workspace: EveesWorkspace, primaryText: string, secondaryText: string): Promise<boolean> {
    
    this.updatesDialogEl.workspace = workspace;
    this.updatesDialogEl.primaryText = primaryText;
    this.updatesDialogEl.secondaryText = secondaryText;

    this.showUpdatesDialog = true;

    await this.updateComplete;

    return new Promise((resolve) => {
      this.updatesDialogEl.resolved = (value) => {
        this.showUpdatesDialog = false;
        resolve(value);
      };
    });
  }

  renderUpdatesDialog() {
    return html`
      <evees-dialog id="updates-dialog">
        <evees-update-diff id="evees-update-diff"></evees-update-diff>
      </evees-dialog>`;
  }

  renderLoading() {
    return html`
      <mwc-circular-progress></mwc-circular-progress>
    `;
  }

  renderInfo() {
    return html`
      <div class="perspective-details">
        <div class="technical-details">
          <div class="card-container">
            <div class="card tech-card">
              <table class="tech-table">
                <tr>
                  <td class="prop-name">perspective-id:</td>
                  <td class="prop-value">${this.perspectiveData.id}</td>
                </tr>
                <tr>
                  <td class="prop-name">context:</td>
                  <td class="prop-value">${this.perspectiveData.details.context}</td>
                </tr>
                <tr>
                  <td class="prop-name">authority:</td>
                  <td class="prop-value">${this.perspectiveData.perspective.authority}</td>
                </tr>
                <tr>
                  <td class="prop-name">head:</td>
                  <td class="prop-value">${JSON.stringify(this.perspectiveData.head)}</td>
                </tr>
                <tr>
                  <td class="prop-name">data:</td>
                  <td class="prop-value">${JSON.stringify(this.perspectiveData.data)}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        .perspective-details {
          padding: 5px;
        }

        .summary {
          margin: 0 auto;
          padding: 32px 32px;
          max-width: 300px;
          text-align: center;
        }

        .card-container {
          flex-grow: 1;
          display: flex;
          padding: 10px;
        }

        .card {
          flex: 1;
          width: 100%;
          height: 100%;
          border: solid 1px #cccccc;
          border-radius: 3px;
        }

        .technical-details {
          max-width: 640px;
          margin: 0 auto;
        }

        .tech-card {
          width: 100%;
          padding: 16px 32px;
          text-align: center;
        }

        .tech-table .prop-name {
          text-align: right;
          font-weight: bold;
        }

        .tech-table .prop-value {
          font-family: Lucida Console, Monaco, monospace;
          font-size: 12px;
          text-align: left;
        }
      `
    ];
  }
}
