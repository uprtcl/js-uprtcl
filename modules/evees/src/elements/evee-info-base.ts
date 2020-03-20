import { LitElement, property, html, css } from 'lit-element';
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
import { AccessControlService, OwnerPermissions } from '@uprtcl/access-control';
import { Pattern, Creatable, Signed, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';

import {
  UpdateRequest,
  RemotesConfig,
  ProposalCreatedEvent,
  Perspective,
  PerspectiveDetails,
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  UPDATE_HEAD_ACTION
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesModule } from '../evees.module';
import { UPDATE_HEAD, CREATE_PROPOSAL, AUTHORIZE_PROPOSAL, EXECUTE_PROPOSAL, DELETE_PERSPECTIVE } from '../graphql/queries';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees, CreatePerspectiveArgs } from '../services/evees';

import { OwnerPreservingConfig } from '../merge/owner-preserving.merge-strategy';
import { executeActions, cacheActions } from '../utils/actions';
import { NewPerspectiveData } from '../services/evees.provider';

interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  canWrite: Boolean;
  permissions: any;
  data: { id: string };
}

export class EveesInfoBase extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ attribute: false })
  loading: Boolean = false;

  @property({ attribute: false })
  activeTabIndex: number = 0;

  @property({ attribute: false })
  publicRead: boolean = true;

  @property({ type: String, attribute: false })
  forceUpdate: string = 'true';

  perspectiveData!: PerspectiveData;

  protected client: ApolloClient<any> | undefined = undefined;
  protected merge: MergeStrategy  | undefined = undefined;
  protected evees: Evees | undefined = undefined;
  protected recognizer: PatternRecognizer | undefined = undefined;
  protected cache: EntityCache | undefined = undefined;
  protected remotesConfig: RemotesConfig | undefined = undefined;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.merge = this.request(EveesBindings.MergeStrategy);
    this.evees = this.request(EveesModule.bindings.Evees);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.cache = this.request(DiscoveryModule.bindings.EntityCache);
    this.remotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.get('perspectiveId') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }
  }

  async load() {
    if(!this.client) throw new Error('client undefined');

    this.loading = true;
    const result = await this.client.query({
      query: gql`
        {
          entity(id: "${this.perspectiveId}") {
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
                origin
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
      data: {
        id: result.data.entity.head.data.id
      }
    };

    this.publicRead = this.perspectiveData.permissions.publicRead !== undefined ? this.perspectiveData.permissions.publicRead : true;

    this.logger.info('load', { perspectiveData: this.perspectiveData });
    this.loading = false;
  }

  
  connectedCallback() {
    super.connectedCallback();
  
    this.addEventListener('permissions-updated', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: permissions-updated ', { perspectiveId: this.perspectiveId, e });
      e.stopPropagation();
      this.load();
    }) as EventListener);
  }

  reload() {
    if (this.forceUpdate === 'true') {
      this.forceUpdate = 'false';
    } else { 
      this.forceUpdate === 'true'
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

  async otherPerspectiveMerge(fromPerspectiveId: string, toPerspectiveId: string, isProposal: boolean) {
    if(!this.evees) throw new Error('evees undefined');
    if(!this.merge) throw new Error('merge undefined');
    
    this.logger.info(
      `merge ${fromPerspectiveId} on ${toPerspectiveId} - isProposal: ${isProposal}`
    );

    const remote = await this.evees.getPerspectiveProviderById(toPerspectiveId);

    const accessControl = remote.accessControl as AccessControlService<OwnerPermissions>;
    const permissions = await accessControl.getPermissions(toPerspectiveId);

    if (permissions  === undefined) throw new Error('target perspective dont have permissions control');
    
    if (!permissions.owner) {
      // TODO: ownerPreserving merge should be changed to permissionPreserving merge
      throw new Error(
        'Target perspective dont have an owner. TODO: ownerPreserving merge should be changed to permissionPreserving merge'
      );
    }

    const config: OwnerPreservingConfig = {
      targetAuthority: remote.authority,
      targetCanWrite: permissions.owner
    };
    
    const [perspectiveId, actions] = await this.merge.mergePerspectives(
      toPerspectiveId,
      fromPerspectiveId,
      config
    );

    if (isProposal) {
      await this.createMergeProposal(fromPerspectiveId, toPerspectiveId, actions);
    } else {
      await this.mergePerspective(actions);
    }

    if (this.perspectiveId !== toPerspectiveId) {
      this.otherPerspectiveClicked(toPerspectiveId);
    } else {
      /** reload perspectives-list */
      this.reload();
    }
  }

  async mergePerspective(actions: UprtclAction[]): Promise<void> {
    if(!this.cache) throw new Error('cache undefined');
    if(!this.client) throw new Error('client undefined');
    if(!this.recognizer) throw new Error('recognizer undefined');

    await cacheActions(actions, this.cache, this.client);
    await executeActions(actions, this.client, this.recognizer);

    const updateRequests = actions.filter(a => a.type === UPDATE_HEAD_ACTION).map(a => a.payload);

    const updateHeadsPromises = updateRequests.map(async (updateRequest: UpdateRequest) => {
      if(!this.client) throw new Error('client undefined');

      await this.client.mutate({
        mutation: UPDATE_HEAD,
        variables: {
          perspectiveId: updateRequest.perspectiveId,
          headId: updateRequest.newHeadId
        }
      });
    });

    await Promise.all(updateHeadsPromises);
  }

  /** executes a given function for each group of actions on perspectives of the same origin */
  async executeActionsBatched(
    actions: UprtclAction[],
    actionToPerspectiveId: (string) => Promise<string>,
    executeActionsOnAuthority: (authority: string, actions: UprtclAction[]) => Promise<void>
  ) {
    const authoritiesPromises = actions.map(async (action: UprtclAction) => {
      if(!this.client) throw new Error('client undefined');

      const perspectiveId = actionToPerspectiveId(action);

      const result = await this.client.query({
        query: gql`
          {
            entity(id: "${perspectiveId}") {
              id
              ... on Perspective {
                payload {
                  origin
                }
              }
            }
          }
        `
      });

      return {
        origin: result.data.entity.payload.origin,
        action: action
      };
    });

    const authoritiesData = await Promise.all(authoritiesPromises);

    const actionsByAuthority = {};

    for (var i = 0; i < authoritiesData.length; i++) {
      if (!actionsByAuthority[authoritiesData[i].origin]) {
        actionsByAuthority[authoritiesData[i].origin] = [];
      }
      actionsByAuthority[authoritiesData[i].origin].push(authoritiesData[i].action);
    }

    const executePromises = Object.keys(actionsByAuthority).map(async (authority: string) => {
      return executeActionsOnAuthority(authority, actionsByAuthority[authority]);
    });

    return Promise.all(executePromises);
  }

  async createMergeProposal(fromPerspectiveId: string, toPerspectiveId: string, actions: UprtclAction[]): Promise<void> {
    if(!this.client) throw new Error('client undefined');
    if(!this.cache) throw new Error('cache undefined');
    if(!this.recognizer) throw new Error('recognizer undefined');
    

    await cacheActions(actions, this.cache, this.client);

    /** create commits and data */
    const dataActions = actions.filter(a =>
      [CREATE_DATA_ACTION, CREATE_COMMIT_ACTION].includes(a.type)
    );
    await executeActions(dataActions, this.client, this.recognizer);

    await this.executeActionsBatched(
      actions.filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION),
      action => action.entity.id,
      async (authority, actions) => {
        if(!this.evees) throw new Error('evees undefined');
        const remote = this.evees.getAuthority(authority);

        const perspectivesData = actions.map(
          (action: UprtclAction): NewPerspectiveData => {
            if (!action.entity) throw new Error('entity not found');

            return {
              perspective: action.entity,
              details: action.payload.details,
              canWrite: action.payload.owner
            };
          }
        );

        await remote.clonePerspectivesBatch(perspectivesData);

        this.logger.info('created perspective batch', { authority, perspectivesData });
      }
    );

    await this.executeActionsBatched(
      actions.filter(a => a.type === UPDATE_HEAD_ACTION),
      action => action.payload.perspectiveId,
      async (authority, actions) => {
        if(!this.client) throw new Error('client undefined');
        
        const result = await this.client.mutate({
          mutation: CREATE_PROPOSAL,
          variables: {
            toPerspectiveId: toPerspectiveId, 
            fromPerspectiveId: fromPerspectiveId, 
            updateRequests: actions.map(action => action.payload)
          }
        });

        const proposalId = result.data.addProposal.id;

        this.logger.info('created proposal', { proposalId, actions });

        this.dispatchEvent(
          new ProposalCreatedEvent({
            detail: { proposalId, authority },
            cancelable: true,
            composed: true,
            bubbles: true
          })
        );
      }
    );
  }

  async authorizeProposal(e: CustomEvent) {
    if(!this.client) throw new Error('client undefined');

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
    if(!this.client) throw new Error('client undefined');

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

  getCreatePattern(symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  async newPerspectiveClicked() {
    if(!this.remotesConfig) throw new Error('remotesConfig undefined');

    this.loading = true;

    if (!this.perspectiveData.details.headId)
      throw new Error('Cannot create a perspective that does not have a headId');

    /** new perspectives are always created in one evees remote */
    const createPerspective: Creatable<
      CreatePerspectiveArgs,
      Signed<Perspective>
    > = this.getCreatePattern(EveesModule.bindings.PerspectivePattern);

    const perspective = await createPerspective.create()(
      {
        fromDetails: {
          headId: this.perspectiveData.details.headId,
          context: this.perspectiveData.details.context
        }
      },
      this.remotesConfig.defaultCreator.authority
    );

    const newPerspectiveId = perspective.id;
    
    this.checkoutPerspective(newPerspectiveId);
    this.logger.info('newPerspectiveClicked() - perspective created', { newPerspectiveId });
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
    if(!this.client) throw new Error('client undefined');

    await this.client.mutate({
      mutation: DELETE_PERSPECTIVE,
      variables: {
        perspectiveId: this.perspectiveId
      }
    });

    this.checkoutPerspective(this.firstPerspectiveId);
  }

  renderLoading() {
    return html`
      <mwc-circular-progress></mwc-circular-progress>
    `;
  }
}
