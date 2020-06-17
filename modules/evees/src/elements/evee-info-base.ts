import { LitElement, property, html, css, query } from 'lit-element';

import { ApolloClient, gql } from 'apollo-boost';

import '@authentic/mwc-card';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import {
  AccessControlService,
  OwnerPermissions,
  SET_PUBLIC_READ,
} from '@uprtcl/access-control';
import {
  CortexModule,
  PatternRecognizer,
  Entity,
  Signed,
} from '@uprtcl/cortex';
import {
  DiscoveryModule,
  EntityCache,
  loadEntity,
} from '@uprtcl/multiplatform';

import {
  RemoteMap,
  ProposalCreatedEvent,
  Perspective,
  PerspectiveDetails,
  Commit,
} from '../types';
import { EveesBindings } from '../bindings';
import {
  UPDATE_HEAD,
  AUTHORIZE_PROPOSAL,
  EXECUTE_PROPOSAL,
  DELETE_PERSPECTIVE,
  CREATE_AND_ADD_PROPOSAL,
} from '../graphql/queries';
import { EveesHelpers } from '../graphql/helpers';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees } from '../services/evees';

import { EveesRemote } from '../services/evees.remote';

import { EveesDialog } from './common-ui/evees-dialog';
import { EveesWorkspace } from '../services/evees.workspace';
import { EveesDiff } from './evees-diff';

interface PerspectiveData {
  id?: string;
  perspective?: Perspective;
  details?: PerspectiveDetails;
  canWrite?: Boolean;
  permissions?: any;
  head?: Entity<Commit>;
  data: Entity<any>;
}

export class EveesInfoBase extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'ref' })
  ref!: string;

  @property({ type: String, attribute: 'first-ref' })
  firstRef!: string;

  @property({ type: String, attribute: 'default-authority' })
  defaultAuthority: string | undefined = undefined;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: String, attribute: false })
  entityType: string | undefined = undefined;

  @property({ attribute: false })
  loading: Boolean = false;

  @property({ attribute: false })
  publicRead: boolean = true;

  @property({ attribute: false })
  isLogged: boolean = false;

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

  @query('#updates-dialog')
  updatesDialogEl!: EveesDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  perspectiveData!: PerspectiveData;
  pullWorkspace!: EveesWorkspace;

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
    this.evees = this.request(EveesBindings.Evees);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.cache = this.request(DiscoveryModule.bindings.EntityCache);
    this.remoteMap = this.request(EveesBindings.RemoteMap);

    if (this.defaultAuthority !== undefined) {
      this.defaultRemote = (this.requestAll(
        EveesBindings.EveesRemote
      ) as EveesRemote[]).find(
        (remote) => remote.authority === this.defaultAuthority
      );
    }

    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.get('ref') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }

    if (changedProperties.has('defaultAuthority')) {
      this.defaultRemote = (this.requestAll(
        EveesBindings.EveesRemote
      ) as EveesRemote[]).find(
        (remote) => remote.authority === this.defaultAuthority
      );
    }
  }

  async load() {
    const entity = await loadEntity(this.client, this.ref);
    if (!entity) throw Error(`Entity not found ${this.ref}`);

    this.entityType = this.recognizer.recognizeType(entity);

    this.loading = true;

    if (this.entityType === EveesBindings.PerspectiveType) {
      const accessControl = await EveesHelpers.getAccessControl(
        this.client,
        entity.id
      );

      const headId = await EveesHelpers.getPerspectiveHeadId(
        this.client,
        this.ref
      );
      const context = await EveesHelpers.getPerspectiveContext(
        this.client,
        this.ref
      );

      const head = await loadEntity<Commit>(this.client, headId);
      const data = await EveesHelpers.getPerspectiveData(this.client, this.ref);

      this.perspectiveData = {
        id: this.ref,
        details: {
          context: context,
          headId: headId,
        },
        perspective: (entity.object as Signed<Perspective>).payload,
        canWrite: accessControl ? accessControl.canWrite : true,
        permissions: accessControl ? accessControl.permissions : undefined,
        head,
        data,
      };

      this.publicRead =
        this.perspectiveData.permissions.publicRead !== undefined
          ? this.perspectiveData.permissions.publicRead
          : true;

      this.logger.info('load', { perspectiveData: this.perspectiveData });

      this.checkPull();
    }

    if (this.entityType === EveesBindings.CommitType) {
      const head = await loadEntity<Commit>(this.client, this.ref);
      const data = await EveesHelpers.getCommitData(this.client, this.ref);

      this.perspectiveData = {
        head,
        data,
      };

      this.publicRead = true;
    }

    this.isLogged =
      this.defaultRemote !== undefined
        ? this.defaultRemote.userId !== undefined
        : false;

    this.reloadChildren();
    this.loading = false;
  }

  async checkPull() {
    if (this.entityType !== EveesBindings.PerspectiveType) {
      this.firstHasChanges = false;
    }

    if (this.ref === this.firstRef || !this.perspectiveData.canWrite) {
      this.firstHasChanges = false;
      return;
    }

    const remote = await this.evees.getPerspectiveProviderById(this.ref);

    const config = {
      forceOwner: true,
      authority: this.perspectiveData.perspective?.authority,
      canWrite: remote.userId,
      parentId: this.ref,
    };

    this.pullWorkspace = new EveesWorkspace(this.client, this.recognizer);

    await this.merge.mergePerspectivesExternal(
      this.ref,
      this.firstRef,
      this.pullWorkspace,
      config
    );

    this.logger.info('checkPull()');
    this.firstHasChanges = this.pullWorkspace.hasUpdates();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('permissions-updated', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: permissions-updated ', {
        perspectiveId: this.ref,
        e,
      });
      e.stopPropagation();
      this.load();
    }) as EventListener);
  }

  reloadChildren() {
    if (this.forceUpdate === 'true') {
      this.forceUpdate = 'false';
    } else {
      this.forceUpdate = 'true';
    }
  }

  async login() {
    if (this.defaultRemote === undefined)
      throw new Error('default remote undefined');
    this.loggingIn = true;
    await this.defaultRemote.login();

    await this.client.resetStore();
    this.reloadChildren();
    this.load();
    this.loggingIn = false;
  }

  async logout() {
    if (this.defaultRemote === undefined)
      throw new Error('default remote undefined');
    await this.defaultRemote.logout();

    await this.client.resetStore();
    this.reloadChildren();
    this.load();
  }

  async makePublic() {
    if (!this.client) throw new Error('client undefined');
    this.makingPublic = true;
    await this.client.mutate({
      mutation: SET_PUBLIC_READ,
      variables: {
        entityId: this.ref,
        value: true,
      },
    });

    this.makingPublic = false;

    this.load();
  }

  async otherPerspectiveMerge(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    isProposal: boolean
  ) {
    this.logger.info(
      `merge ${fromPerspectiveId} on ${toPerspectiveId} - isProposal: ${isProposal}`
    );

    const remote = await this.evees.getPerspectiveRemoteById(toPerspectiveId);

    const accessControl = remote.accessControl as AccessControlService<
      OwnerPermissions
    >;
    const permissions = await accessControl.getPermissions(toPerspectiveId);

    if (permissions === undefined)
      throw new Error('target perspective dont have permissions control');

    if (!permissions.owner) {
      // TODO: ownerPreserving merge should be changed to permissionPreserving merge
      throw new Error(
        'Target perspective dont have an owner. TODO: ownerPreserving merge should be changed to permissionPreserving merge'
      );
    }

    const workspace = new EveesWorkspace(this.client, this.recognizer);

    const config = {
      forceOwner: true,
      remoteId: remote.id,
      canWrite: permissions.owner,
      parentId: this.ref,
    };

    await this.merge.mergePerspectivesExternal(
      toPerspectiveId,
      fromPerspectiveId,
      workspace,
      config
    );

    const confirm = await this.updatesDialog(workspace, 'propose', 'cancel');

    if (!confirm) {
      return;
    }

    const toHeadId = await EveesHelpers.getPerspectiveHeadId(
      this.client,
      toPerspectiveId
    );
    const fromHeadId = await EveesHelpers.getPerspectiveHeadId(
      this.client,
      fromPerspectiveId
    );

    if (isProposal) {
      await this.createMergeProposal(
        fromPerspectiveId,
        toPerspectiveId,
        fromHeadId,
        toHeadId,
        workspace
      );
    } else {
      await this.applyWorkspace(workspace);
    }

    if (this.ref !== toPerspectiveId) {
      this.checkoutPerspective(toPerspectiveId);
    } else {
      /** reload perspectives-list */
      this.reloadChildren();
    }
  }

  async applyWorkspace(workspace: EveesWorkspace): Promise<void> {
    await workspace.execute(this.client);

    const update = workspace.getUpdates().map(async (update) => {
      return this.client.mutate({
        mutation: UPDATE_HEAD,
        variables: {
          perspectiveId: update.perspectiveId,
          headId: update.newHeadId,
        },
      });
    });

    await Promise.all(update);
  }

  async createMergeProposal(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    fromHeadId: string,
    toHeadId: string,
    workspace: EveesWorkspace
  ): Promise<void> {
    // TODO: handle proposals and updates on multiple authorities.
    const authority = await EveesHelpers.getPerspectiveAuthority(
      this.client,
      toPerspectiveId
    );

    const not = await workspace.isSingleAuthority(authority);
    if (!not)
      throw new Error(
        'cant create merge proposals on multiple authorities yet'
      );

    /** create commits and data */
    await workspace.executeCreate(this.client);
    await workspace.precacheNewPerspectives(this.client);

    const proposal = {
      toPerspectiveId,
      fromPerspectiveId,
      toHeadId,
      fromHeadId,
      updates: workspace.getUpdates(),
    };

    const result = await this.client.mutate({
      mutation: CREATE_AND_ADD_PROPOSAL,
      variables: {
        perspectives: workspace.getNewPerspectives(),
        proposal: proposal,
      },
    });

    const proposalId = result.data.createAndAddProposal.id;

    this.logger.info('created proposal');

    this.dispatchEvent(
      new ProposalCreatedEvent({
        detail: { proposalId, authority },
        cancelable: true,
        composed: true,
        bubbles: true,
      })
    );
  }

  async authorizeProposal(e: CustomEvent) {
    if (!this.client) throw new Error('client undefined');

    const proposalId = e.detail.proposalId;
    const perspectiveId = e.detail.perspectiveId;
    await this.client.mutate({
      mutation: AUTHORIZE_PROPOSAL,
      variables: {
        proposalId: proposalId,
        perspectiveId: perspectiveId,
        authorize: true,
      },
    });

    this.logger.info('accepted proposal', { proposalId });

    /** this will refresh the current perspective content */
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: perspectiveId,
        },
        composed: true,
        bubbles: true,
      })
    );

    this.reloadChildren();
  }

  async executeProposal(e: CustomEvent) {
    if (!this.client) throw new Error('client undefined');

    const proposalId = e.detail.proposalId;
    const perspectiveId = e.detail.perspectiveId;

    await this.client.mutate({
      mutation: EXECUTE_PROPOSAL,
      variables: {
        proposalId: proposalId,
        perspectiveId: perspectiveId,
      },
    });

    this.logger.info('accepted proposal', { proposalId });

    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: perspectiveId,
        },
        composed: true,
        bubbles: true,
      })
    );

    this.reloadChildren();
  }

  async newPerspectiveClicked() {
    this.creatingNewPerspective = true;

    const workspace = new EveesWorkspace(this.client, this.recognizer);
    const newPerspectiveId = await this.evees.forkPerspective(
      this.ref,
      workspace,
      this.defaultAuthority
    );
    await workspace.execute(this.client);

    this.checkoutPerspective(newPerspectiveId);

    this.logger.info('newPerspectiveClicked() - perspective created', {
      id: newPerspectiveId,
    });
    this.creatingNewPerspective = false;
  }

  checkoutPerspective(perspectiveId: string) {
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: perspectiveId,
        },
        composed: true,
        bubbles: true,
      })
    );
  }

  async proposeMergeClicked() {
    this.proposingUpdate = true;
    await this.otherPerspectiveMerge(this.ref, this.firstRef, true);
    this.proposingUpdate = false;
  }

  perspectiveTextColor() {
    if (this.ref === this.firstRef) {
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
        perspectiveId: this.ref,
      },
    });

    this.checkoutPerspective(this.firstRef);
  }

  async updatesDialog(
    workspace: EveesWorkspace,
    primaryText: string,
    secondaryText: string
  ): Promise<boolean> {
    this.showUpdatesDialog = true;
    await this.updateComplete;

    this.updatesDialogEl.primaryText = primaryText;
    this.updatesDialogEl.secondaryText = secondaryText;
    this.updatesDialogEl.showSecondary =
      secondaryText !== undefined ? 'true' : 'false';

    this.eveesDiffEl.workspace = workspace;

    return new Promise((resolve) => {
      this.updatesDialogEl.resolved = (value) => {
        this.showUpdatesDialog = false;
        resolve(value);
      };
    });
  }

  renderUpdatesDialog() {
    return html` <evees-dialog id="updates-dialog">
      <evees-update-diff id="evees-update-diff"></evees-update-diff>
    </evees-dialog>`;
  }

  renderLoading() {
    return html` <mwc-circular-progress></mwc-circular-progress> `;
  }

  renderInfo() {
    return html`
      <div class="perspective-details">
        <div class="prop-name"><h2>${this.entityType}</h2></div>
        ${this.entityType === EveesBindings.PerspectiveType
          ? html`<div class="prop-name">perspective-id</div>
              <pre class="prop-value">
${JSON.stringify(this.perspectiveData.id)}</pre
              >

              <div class="prop-name">context</div>
              <pre class="prop-value">
${this.perspectiveData.details?.context}</pre
              >

              <div class="prop-name">authority</div>
              <pre class="prop-value">
${this.perspectiveData.perspective?.authority}</pre
              > `
          : ''}

        <div class="prop-name">head</div>
        <pre class="prop-value">
${JSON.stringify(this.perspectiveData.head, undefined, 2)}</pre
        >

        <div class="prop-name">data</div>
        <pre class="prop-value">
${JSON.stringify(this.perspectiveData.data, undefined, 2)}</pre
        >
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
      `,
    ];
  }
}
