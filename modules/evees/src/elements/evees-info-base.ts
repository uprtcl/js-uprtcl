import { LitElement, property, html, css, query, TemplateResult } from 'lit-element';

import { ApolloClient, gql } from 'apollo-boost';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Entity, Signed } from '@uprtcl/cortex';
import { DiscoveryModule, EntityCache, loadEntity } from '@uprtcl/multiplatform';
import { MenuConfig, UprtclDialog } from '@uprtcl/common-ui';

import {
  ProposalCreatedEvent,
  Perspective,
  PerspectiveDetails,
  Commit,
  getAuthority,
  EveesConfig
} from '../types';
import { EveesBindings } from '../bindings';
import { DELETE_PERSPECTIVE, CREATE_PROPOSAL, FORK_PERSPECTIVE } from '../graphql/queries';
import { EveesHelpers } from '../graphql/evees.helpers';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees } from '../services/evees';

import { EveesRemote } from '../services/evees.remote';

import { EveesWorkspace } from '../services/evees.workspace';
import { EveesDiff } from './evees-diff';
import { ContentUpdatedEvent } from './events';

interface PerspectiveData {
  id?: string;
  perspective?: Perspective;
  details?: PerspectiveDetails;
  canWrite?: Boolean;
  permissions?: any;
  head?: Entity<Commit>;
  data?: Entity<any>;
}

export class EveesInfoBase extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'uref' })
  uref!: string;

  @property({ type: String, attribute: 'first-uref' })
  firstRef!: string;

  @property({ type: String, attribute: 'parent-id' })
  parentId!: string;

  @property({ type: String, attribute: 'default-remote' })
  defaultRemoteId: string | undefined = undefined;

  @property({ type: String, attribute: 'official-remote' })
  officialRemoteId: string | undefined = undefined;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: Boolean, attribute: 'emit-proposals' })
  emitProposals: boolean = false;

  @property({ type: String, attribute: false })
  entityType: string | undefined = undefined;

  @property({ attribute: false })
  loading: Boolean = false;

  @property({ attribute: false })
  isLogged: boolean = false;

  @property({ attribute: false })
  isLoggedOnDefault;

  @property({ attribute: false })
  forceUpdate: string = 'true';

  @property({ attribute: false })
  showUpdatesDialog: boolean = false;

  @property({ attribute: false })
  loggingIn: boolean = false;

  @property({ attribute: false })
  creatingNewPerspective: boolean = false;

  @property({ attribute: false })
  proposingUpdate: boolean = false;

  @property({ attribute: false })
  makingPublic: boolean = false;

  @property({ attribute: false })
  firstHasChanges!: boolean;

  @property({ attribute: false })
  merging: boolean = false;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  @property({ attribute: false })
  eveesDiffInfoMessage!: TemplateResult;

  perspectiveData!: PerspectiveData;
  pullWorkspace: EveesWorkspace | undefined = undefined;

  protected client!: ApolloClient<any>;
  protected config!: EveesConfig;
  protected merge!: MergeStrategy;
  protected evees!: Evees;
  protected remote!: EveesRemote;
  protected remotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected cache!: EntityCache;

  /** official remote is used to indentity the special perspective, "the master branch" */
  protected officialRemote: EveesRemote | undefined = undefined;

  /** default remote is used to create new branches */
  protected defaultRemote: EveesRemote | undefined = undefined;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.config = this.request(EveesBindings.Config);
    this.merge = this.request(EveesBindings.MergeStrategy);
    this.evees = this.request(EveesBindings.Evees);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.cache = this.request(DiscoveryModule.bindings.EntityCache);

    this.remotes = this.requestAll(EveesBindings.EveesRemote) as EveesRemote[];
    this.defaultRemote =
      this.defaultRemoteId !== undefined
        ? this.remotes.find(remote => remote.id === this.defaultRemoteId)
        : (this.request(EveesBindings.Config) as EveesConfig).defaultRemote;

    this.officialRemote =
      this.officialRemoteId !== undefined
        ? this.remotes.find(remote => remote.id === this.officialRemoteId)
        : (this.request(EveesBindings.Config) as EveesConfig).officialRemote;
  }

  updated(changedProperties) {
    if (changedProperties.get('uref') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }
  }

  /** must be called from subclass as super.load() */
  async load() {
    this.logger.info('Loading evee perspective', this.uref);

    this.remote = await this.evees.getPerspectiveRemoteById(this.uref);

    const entity = await loadEntity(this.client, this.uref);
    if (!entity) throw Error(`Entity not found ${this.uref}`);

    this.entityType = this.recognizer.recognizeType(entity);

    this.loading = true;

    if (this.entityType === EveesBindings.PerspectiveType) {
      const headId = await EveesHelpers.getPerspectiveHeadId(this.client, this.uref);

      const head = headId !== undefined ? await loadEntity<Commit>(this.client, headId) : undefined;
      const data = await EveesHelpers.getPerspectiveData(this.client, this.uref);

      const canWrite = await EveesHelpers.canWrite(this.client, this.uref);

      this.perspectiveData = {
        id: this.uref,
        details: {
          headId: headId
        },
        perspective: (entity.object as Signed<Perspective>).payload,
        canWrite: canWrite,
        head,
        data
      };

      this.logger.info('load', { perspectiveData: this.perspectiveData });
    }

    if (this.entityType === EveesBindings.CommitType) {
      const head = await loadEntity<Commit>(this.client, this.uref);
      const data = await EveesHelpers.getCommitData(this.client, this.uref);

      this.perspectiveData = {
        head,
        data
      };
    }

    this.isLogged = await this.remote.isLogged();

    if (this.defaultRemote) await this.defaultRemote.ready();

    this.isLoggedOnDefault =
      this.defaultRemote !== undefined ? await this.defaultRemote.isLogged() : false;

    this.loading = false;
    this.logger.log(`evee ${this.uref} loaded`, {
      perspectiveData: this.perspectiveData,
      isLogged: this.isLogged,
      isLoggedOnDefault: this.isLoggedOnDefault
    });
  }

  async checkPull(fromUref: string) {
    if (this.entityType !== EveesBindings.PerspectiveType) {
      this.pullWorkspace = undefined;
      return;
    }

    if (this.uref === fromUref || !this.perspectiveData.canWrite) {
      this.pullWorkspace = undefined;
      return;
    }

    if (this.perspectiveData.perspective === undefined) throw new Error('undefined');

    const config = {
      forceOwner: true,
      remote: this.perspectiveData.perspective.remote,
      path: this.perspectiveData.perspective.path,
      canWrite: this.remote.userId,
      parentId: this.uref
    };

    this.pullWorkspace = new EveesWorkspace(this.client, this.recognizer);

    await this.merge.mergePerspectivesExternal(this.uref, fromUref, this.pullWorkspace, config);

    this.logger.info('checkPull()', this.pullWorkspace);
  }

  async getContextPerspectives(perspectiveId?: string): Promise<string[]> {
    perspectiveId = perspectiveId || this.uref;
    const result = await this.client.query({
      query: gql`{
          entity(uref: "${perspectiveId}") {
            id
            ... on Perspective {
              payload {
                remote
                context {
                  id
                  perspectives {
                    id
                  } 
                }
              }
            }
          }
        }`
    });

    /** data on other perspectives (proposals are injected on them) */
    const perspectives =
      result.data.entity.payload.context === null
        ? []
        : result.data.entity.payload.context.perspectives;

    // remove duplicates
    const map = new Map<string, null>();
    perspectives.forEach(perspective => map.set(perspective.id, null));
    return Array.from(map, key => key[0]);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('permissions-updated', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: permissions-updated ', {
        perspectiveId: this.uref,
        e
      });
      e.stopPropagation();
      this.load();
    }) as EventListener);
  }

  async login() {
    if (this.defaultRemote === undefined) throw new Error('default remote undefined');
    this.loggingIn = true;
    await this.defaultRemote.login();

    await this.client.resetStore();
    this.load();
    this.loggingIn = false;
  }

  async logout() {
    if (this.defaultRemote === undefined) throw new Error('default remote undefined');
    await this.defaultRemote.logout();

    await this.client.resetStore();
    this.load();
  }

  async otherPerspectiveMerge(fromPerspectiveId: string, toPerspectiveId: string) {
    this.merging = true;
    this.logger.info(`merge ${fromPerspectiveId} on ${toPerspectiveId}`);

    const workspace = new EveesWorkspace(this.client, this.recognizer);
    const toRemoteId = await EveesHelpers.getPerspectiveRemoteId(this.client, toPerspectiveId);

    const config = {
      forceOwner: true,
      remote: toRemoteId,
      parentId: toPerspectiveId
    };

    const toHeadId = await EveesHelpers.getPerspectiveHeadId(this.client, toPerspectiveId);
    const fromHeadId = await EveesHelpers.getPerspectiveHeadId(this.client, fromPerspectiveId);

    await this.merge.mergePerspectivesExternal(
      toPerspectiveId,
      fromPerspectiveId,
      workspace,
      config
    );

    const canWrite = await EveesHelpers.canWrite(this.client, toPerspectiveId);
    const toRemote = this.remotes.find(r => r.id === toRemoteId);
    const canPropose = toRemote
      ? toRemote.proposals
        ? await toRemote.proposals.canPropose(this.remote.userId)
        : false
      : false;

    const options: MenuConfig = {
      apply: {
        text: canWrite ? 'merge' : 'propose',
        icon: 'done',
        disabled: !canWrite && !canPropose,
        skinny: false
      },
      close: {
        text: 'close',
        icon: 'clear',
        skinny: true
      }
    };

    const result = await this.updatesDialog(
      workspace,
      options,
      this.renderFromToPerspective(toPerspectiveId, fromPerspectiveId)
    );

    if (result !== 'apply') {
      this.merging = false;
      return;
    }

    /* for some remotes the proposal is not created but sent to a parent component who will 
       take care of executing it */
    const emitBecauseOfTarget = await EveesHelpers.checkEmit(
      this.config,
      this.client,
      this.remotes,
      toPerspectiveId
    );

    if (!canWrite && (emitBecauseOfTarget || this.emitProposals)) {
      /* entities are just cloned, not part of the proposal */
      await workspace.executeCreate(this.client);
      await workspace.precacheNewPerspectives(this.client);

      this.dispatchEvent(
        new ProposalCreatedEvent({
          detail: {
            remote: await EveesHelpers.getPerspectiveRemoteId(this.client, toPerspectiveId),
            proposalDetails: {
              newPerspectives: workspace.getNewPerspectives(),
              updates: workspace.getUpdates()
            }
          },
          bubbles: true,
          composed: true
        })
      );

      this.merging = false;
      return;
    }

    /* if the merge execution is not delegated, it is done here. A proposal is created
       on the toPerspective remote, or the changes are directly applied.
       Note that it is assumed that if a user canWrite on toPerspectiveId, he can write 
       on all the perspectives inside the workspace.updates array. */
    if (canWrite) {
      await workspace.execute(this.client);
      /* inform the world */

      workspace.getUpdates().map(update => {
        this.dispatchEvent(
          new ContentUpdatedEvent({
            detail: { uref: update.perspectiveId },
            bubbles: true,
            composed: true
          })
        );
      });
    } else {
      /** create commits and data */
      await workspace.executeCreate(this.client);
      await workspace.precacheNewPerspectives(this.client);

      if (fromHeadId === undefined) throw new Error(`undefined head for ${fromPerspectiveId}`);
      await this.createMergeProposal(
        fromPerspectiveId,
        toPerspectiveId,
        fromHeadId,
        toHeadId,
        workspace
      );
    }

    if (this.uref !== toPerspectiveId) {
      this.checkoutPerspective(toPerspectiveId);
    }

    this.merging = false;
  }

  async createMergeProposal(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    fromHeadId: string,
    toHeadId: string | undefined,
    workspace: EveesWorkspace
  ): Promise<void> {
    // TODO: handle proposals and updates on multiple authorities.
    const toRemoteId = await EveesHelpers.getPerspectiveRemoteId(this.client, toPerspectiveId);

    const not = await workspace.isSingleAuthority(toRemoteId);
    if (!not) throw new Error('cant create merge proposals on multiple authorities yet');

    const result = await this.client.mutate({
      mutation: CREATE_PROPOSAL,
      variables: {
        toPerspectiveId,
        fromPerspectiveId,
        toHeadId,
        fromHeadId,
        newPerspectives: workspace.getNewPerspectives(),
        updates: workspace.getUpdates()
      }
    });

    const proposalId = result.data.addProposal.id;

    this.logger.info('created proposal', { proposalId });
  }

  async deletePerspective(perspectiveId?: string) {
    const result = await this.client.mutate({
      mutation: DELETE_PERSPECTIVE,
      variables: {
        perspectiveId: perspectiveId || this.uref
      }
    });
  }

  async forkPerspective(perspectiveId?: string) {
    this.creatingNewPerspective = true;

    const result = await this.client.mutate({
      mutation: FORK_PERSPECTIVE,
      variables: {
        perspectiveId: perspectiveId || this.uref,
        remote: this.defaultRemoteId
      }
    });

    const newPerspectiveId = result.data.forkPerspective.id;

    this.dispatchEvent(
      new CustomEvent('new-perspective-created', {
        detail: {
          oldPerspectiveId: this.uref,
          newPerspectiveId: newPerspectiveId
        },
        bubbles: true,
        composed: true
      })
    );
    this.checkoutPerspective(newPerspectiveId);

    this.logger.info('newPerspectiveClicked() - perspective created', {
      id: newPerspectiveId
    });
    this.creatingNewPerspective = false;
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
    this.proposingUpdate = true;
    await this.otherPerspectiveMerge(this.uref, this.firstRef);
    this.proposingUpdate = false;
  }

  perspectiveTextColor() {
    if (this.uref === this.firstRef) {
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
        perspectiveId: this.uref
      }
    });

    this.checkoutPerspective(this.firstRef);
  }

  async updatesDialog(
    workspace: EveesWorkspace,
    options: MenuConfig,
    message: TemplateResult = html``
  ): Promise<string> {
    this.showUpdatesDialog = true;
    await this.updateComplete;

    this.updatesDialogEl.options = options;
    this.eveesDiffEl.workspace = workspace;
    this.eveesDiffInfoMessage = message;

    return new Promise(resolve => {
      this.updatesDialogEl.resolved = value => {
        this.showUpdatesDialog = false;
        resolve(value);
      };
    });
  }

  renderUpdatesDialog() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <div>${this.eveesDiffInfoMessage}</div>
        <evees-update-diff id="evees-update-diff"></evees-update-diff>
      </uprtcl-dialog>
    `;
  }

  renderFromToPerspective(toPerspectiveId: string, fromPerspectiveId: string) {
    return html`
      <div class="row merge-message">
        <uprtcl-indicator label="To">
          <evees-perspective-icon perspective-id=${toPerspectiveId}></evees-perspective-icon>
        </uprtcl-indicator>
        <div class="arrow">
          <uprtcl-icon-button icon="arrow_back"></uprtcl-icon-button>
        </div>
        <uprtcl-indicator label="From">
          <evees-perspective-icon perspective-id=${fromPerspectiveId}></evees-perspective-icon>
        </uprtcl-indicator>
      </div>
    `;
  }

  renderLoading() {
    return html`
      <uprtcl-loading></uprtcl-loading>
    `;
  }

  /** overwrite */
  renderIcon() {
    return html`
      <evees-perspective-icon perspective-id=${this.uref}></evees-perspective-icon>
    `;
  }

  renderInfo() {
    return html`
      <div class="perspective-details">
        <div class="prop-name"><h2>${this.entityType}</h2></div>
        ${this.entityType === EveesBindings.PerspectiveType
          ? html`
              <div class="prop-name">perspective id</div>
              <pre class="prop-value">${this.perspectiveData.id}</pre>

              <div class="prop-name">perspective</div>
              <pre class="prop-value">
${JSON.stringify(this.perspectiveData.perspective, undefined, 2)}</pre
              >

              <div class="prop-name">authority</div>
              <pre class="prop-value">
${this.perspectiveData.perspective ? getAuthority(this.perspectiveData.perspective) : ''}</pre
              >
            `
          : ''}

        <div class="prop-name">head</div>
        <pre class="prop-value">${JSON.stringify(this.perspectiveData.head, undefined, 2)}</pre>

        <div class="prop-name">data</div>
        <pre class="prop-value">${JSON.stringify(this.perspectiveData.data, undefined, 2)}</pre>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        .perspective-details {
          padding: 5px;
          text-align: left;
          max-width: calc(100vw - 72px);
          min-width: 490px;
        }

        .prop-name {
          font-weight: bold;
          width: 100%;
        }

        .prop-value {
          font-family: Lucida Console, Monaco, monospace;
          font-size: 12px;
          text-align: left;
          background-color: #a0a3cb;
          color: #1c1d27;
          padding: 16px 16px;
          margin-bottom: 16px;
          border-radius: 6px;
          width: 100%;
          overflow: auto;
          width: calc(100% - 32px);
          overflow-x: auto;
        }
        .row {
          width: 100%;
          display: flex;
          margin-bottom: 20px;
        }
        .merge-message uprtcl-indicator {
          flex: 1 1 auto;
          margin: 5px;
        }
        .merge-message .arrow {
          flex: 0.3 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `
    ];
  }
}
