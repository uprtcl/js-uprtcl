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
import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { AccessControlService, OwnerPermissions } from '@uprtcl/access-control';
import { Pattern, Creatable, Signed, CortexModule, PatternRecognizer } from '@uprtcl/cortex';

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
import { UPDATE_HEAD } from '../graphql/queries';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees, CreatePerspectiveArgs } from '../services/evees';

import { OwnerPreservingConfig } from '../merge/owner-preserving.merge-strategy';
import { executeActions, cacheActions } from 'src/utils/actions';
import { DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';
import { NewPerspectiveData } from 'src/services/evees.provider';

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

  perspectiveData!: PerspectiveData;

  updated(changedProperties) {
    if (changedProperties.get('perspectiveId') !== undefined) {
      this.logger.info('updated() reload', { changedProperties });
      this.load();
    }
  }

  async load() {
    this.loading = true;
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
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

    this.logger.info('load', { perspectiveData: this.perspectiveData });
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  otherPerspectiveClicked(e: CustomEvent) {
    this.logger.info(`otherPerspectiveClicked() ${e.detail.id}`);
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          perspectiveId: e.detail.id
        }
      })
    );
  }

  async otherPerspectiveMerge(fromPerspectiveId: string, isProposal: boolean) {
    this.logger.info(
      `merge ${fromPerspectiveId} on ${this.perspectiveId} - isProposal: ${isProposal}`
    );

    const merge: MergeStrategy = this.request(EveesBindings.MergeStrategy);

    const evees: Evees = this.request(EveesModule.bindings.Evees);
    const remote = evees.getAuthority(this.perspectiveData.perspective.origin);

    const accessControl = remote.accessControl as AccessControlService<OwnerPermissions>;
    const permissions = await accessControl.getPermissions(this.perspectiveId);

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
    const [perspectiveId, actions] = await merge.mergePerspectives(
      this.perspectiveId,
      fromPerspectiveId,
      config
    );

    if (isProposal) {
      this.createMergeProposal(fromPerspectiveId, actions);
    } else {
      this.mergePerspective(actions);
    }
  }

  async mergePerspective(actions: UprtclAction[]) {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const recognizer: PatternRecognizer = this.request(CortexModule.bindings.Recognizer);
    const cache: EntityCache = this.request(DiscoveryModule.bindings.EntityCache);

    await cacheActions(actions, cache, client);
    await executeActions(actions, client, recognizer);

    const updateRequests = actions.filter(a => a.type === UPDATE_HEAD_ACTION).map(a => a.payload);

    const updateHeadsPromises = updateRequests.map(async (updateRequest: UpdateRequest) => {
      await client.mutate({
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
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const authoritiesPromises = actions.map(async (action: UprtclAction) => {
      const perspectiveId = actionToPerspectiveId(action);

      const result = await client.query({
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

  async createMergeProposal(fromPerspectiveId: string, actions: UprtclAction[]) {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const recognizer: PatternRecognizer = this.request(CortexModule.bindings.Recognizer);
    const cache: EntityCache = this.request(DiscoveryModule.bindings.EntityCache);
    const evees: Evees = this.request(EveesModule.bindings.Evees);

    await cacheActions(actions, cache, client);

    /** create commits and data */
    const dataActions = actions.filter(a =>
      [CREATE_DATA_ACTION, CREATE_COMMIT_ACTION].includes(a.type)
    );
    await executeActions(dataActions, client, recognizer);

    await this.executeActionsBatched(
      actions.filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION),
      action => action.entity.id,
      async (authority, actions) => {
        const remote = evees.getAuthority(authority);

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
        const remote = evees.getAuthority(authority);
        if (!remote.proposals) throw new Error('remote cant handle proposals');

        const proposalId = await remote.proposals.createProposal(
          fromPerspectiveId,
          this.perspectiveId,
          actions.map(action => action.payload)
        );

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
    const proposalId = e.detail.proposalId;

    const evees: Evees = this.request(EveesModule.bindings.Evees);

    const remote = evees.getAuthority(this.perspectiveData.perspective.origin);

    if (!remote.proposals) throw new Error('remote cant handle proposals');

    await remote.proposals.acceptProposal(proposalId);

    this.logger.info('accepted proposal', { proposalId });
  }

  async executeProposal(e: CustomEvent) {
    const proposalId = e.detail.proposalId;
    const evees: Evees = this.request(EveesModule.bindings.Evees);

    const remote = evees.getAuthority(this.perspectiveData.perspective.origin);
    if (!remote.proposals) throw new Error('remote cant handle proposals');

    await remote.proposals.executeProposal(proposalId);

    this.logger.info('accepted proposal', { proposalId });
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
    this.loading = true;

    if (!this.perspectiveData.details.headId)
      throw new Error('Cannot create a perspective that does not have a headId');

    /** new perspectives are always created in one evees remote */
    const remotesConfig: RemotesConfig = this.request(EveesModule.bindings.RemotesConfig);

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
      remotesConfig.defaultCreator.authority
    );

    const newPerspectiveId = perspective.id;

    this.logger.info('newPerspectiveClicked() - perspective created', { newPerspectiveId });

    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: newPerspectiveId
        },
        composed: true,
        bubbles: true
      })
    );
  }

  perspectiveTextColor() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return '#37352f';
    } else {
      return '#ffffff';
    }
  }

  renderLoading() {
    return html`
      <mwc-circular-progress></mwc-circular-progress>
    `;
  }
}
