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

import {
  UpdateRequest,
  RemotesConfig,
  ProposalCreatedEvent,
  Perspective,
  PerspectiveDetails
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesModule } from '../evees.module';
import { CREATE_PERSPECTIVE, UPDATE_HEAD } from '../graphql/queries';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees } from '../services/evees';

import { DEFAULT_COLOR } from './evees-perspective';
import { OwnerPreservingMergeStrategy, OwnerPreservinConfig } from 'src/merge/owner-preserving.merge-strategy';

interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  canWrite: Boolean;
  permissions: any;
}

export class EveesInfo extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: String })
  popout: string = 'true';

  @property({ attribute: false })
  show: Boolean = false;

  @property({ attribute: false })
  loading: Boolean = false;

  @property({ attribute: false })
  activeTabIndex: number = 0;

  perspectiveData!: PerspectiveData;

  firstUpdated() {
    if (this.popout !== 'true') {
      this.show = true;
      this.load();
    }
  }

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
                identifier
              }
              head {
                id
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
        context: result.data.entity.context.identifier,
        headId: result.data.entity.head.id,
        name: result.data.entity.name
      },
      perspective: result.data.entity.payload,
      canWrite: accessControl ? accessControl.canWrite : true,
      permissions: accessControl ? accessControl.permissions : undefined
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

    if (!remote.userId) throw new Error('remote dont have a logged user');

    const config: OwnerPreservinConfig = {
      targetAuthority: remote.authority,
      targetCanWrite: remote.userId
    }
    const updateRequests = await merge.mergePerspectives(this.perspectiveId, fromPerspectiveId, config);

    this.logger.info('merge computed', { updateRequests });

    if (isProposal) {
      this.createMergeProposal(fromPerspectiveId, updateRequests);
    } else {
      this.mergePerspective(updateRequests);
    }
  }

  async mergePerspective(updateRequests: UpdateRequest[]) {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

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

  async createMergeProposal(fromPerspectiveId: string, updateRequests: UpdateRequest[]) {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    /** filter updates per authority */
    const authoritiesPromises = updateRequests.map(async (updateRequest: UpdateRequest) => {
      const result = await client.query({
        query: gql`
          {
            entity(id: "${updateRequest.perspectiveId}") {
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
        updateRequest: updateRequest
      };
    });

    const authoritiesData = await Promise.all(authoritiesPromises);

    const updatesByAuthority = {};

    for (var i = 0; i < authoritiesData.length; i++) {
      if (!updatesByAuthority[authoritiesData[i].origin]) {
        updatesByAuthority[authoritiesData[i].origin] = [];
      }
      updatesByAuthority[authoritiesData[i].origin].push(authoritiesData[i].updateRequest);
    }

    const evees: Evees = this.request(EveesModule.bindings.Evees);

    Object.keys(updatesByAuthority).map(async (authority: string) => {
      const remote = evees.getAuthority(authority);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      const proposalId = await remote.proposals.createProposal(
        fromPerspectiveId,
        this.perspectiveId,
        updatesByAuthority[authority]
      );

      this.logger.info('created proposal', { proposalId, updateRequests });

      this.dispatchEvent(
        new ProposalCreatedEvent({
          detail: { proposalId },
          cancelable: true,
          composed: true,
          bubbles: true
        })
      );
    });
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

  showClicked() {
    this.show = !this.show;
    if (this.show) this.load();
  }

  async newPerspectiveClicked() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    this.loading = true;

    /** new perspectives are always created in one evees remote */
    const remotesConfig: RemotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    const perspectiveMutation = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: this.perspectiveData.details.headId,
        authority: remotesConfig.defaultCreator.authority,
        context: this.perspectiveData.details.context,
        recursive: true
      }
    });

    const newPerspectiveId = perspectiveMutation.data.createPerspective.id;
    this.show = false;

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

  perspectiveTitle() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return 'Current Perspective';
    } else {
      const name =
        this.perspectiveData.details.name !== ''
          ? this.perspectiveData.details.name
          : `by ${this.perspectiveData.perspective.creatorId.substr(0, 6)} on ${
              this.perspectiveData.perspective.timestamp
            }`;

      return `Other Perspective - ${name}`;
    }
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

  renderInfo() {
    return html`
      <div class="perspective-details">
        <span><strong>Id:</strong> ${this.perspectiveData.id}</span>
        <span><strong>Name:</strong> ${this.perspectiveData.details.name}</span>
        <span><strong>Context:</strong> ${this.perspectiveData.details.context}</span>
        <span><strong>Origin:</strong> ${this.perspectiveData.perspective.origin}</span>
        <span><strong>Head:</strong> ${this.perspectiveData.details.headId}</span>
      </div>
    `;
  }

  renderOtherPerspectives() {
    return html`
      <div class="perspectives-list">
        <evees-perspectives-list
          perspective-id=${this.perspectiveId}
          first-perspective-id=${this.firstPerspectiveId}
          @perspective-selected=${this.otherPerspectiveClicked}
          @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, false)}
          @create-proposal=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, true)}
          @authorize-proposal=${this.authorizeProposal}
          @execute-proposal=${this.executeProposal}
        ></evees-perspectives-list>
      </div>
      <div class="row">
        ${this.loading
          ? this.renderLoading()
          : html`
              <mwc-button
                outlined
                icon="call_split"
                @click=${this.newPerspectiveClicked}
                label="Create new perspective"
              ></mwc-button>
            `}
      </div>
    `;
  }

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        <permissions-for-entity hash=${this.perspectiveId}></permissions-for-entity>
      </div>
    `;
  }

  renderTabContent() {
    if (this.activeTabIndex === 0) return this.renderOtherPerspectives();
    else if (this.activeTabIndex === 1) return this.renderInfo();
    else return this.renderPermissions();
  }

  render() {
    return html`
      <div class="container">
        ${this.popout === 'true'
          ? html`
              <div
                class="button"
                style=${styleMap({
                  backgroundColor: this.eveeColor ? this.eveeColor : DEFAULT_COLOR
                })}
                @click=${this.showClicked}
              ></div>
            `
          : ''}
        ${this.show
          ? html`
              <mwc-card
                class=${['info-box'].concat(this.popout === 'true' ? ['popout'] : []).join(' ')}
              >
                ${this.perspectiveData
                  ? html`
                      <div class="column">
                        <div
                          class="perspective-title"
                          style=${styleMap({
                            backgroundColor: this.eveeColor,
                            color: this.perspectiveTextColor()
                          })}
                        >
                          ${this.perspectiveTitle()}
                        </div>

                        <mwc-tab-bar
                          @MDCTabBar:activated=${e => (this.activeTabIndex = e.detail.index)}
                        >
                          <mwc-tab .label=${this.t('evees:other-perspectives')} hasImageIcon>
                            <mwc-icon>list_alt</mwc-icon>
                          </mwc-tab>
                          <mwc-tab .label=${this.t('evees:information')} hasImageIcon>
                            <mwc-icon>info</mwc-icon>
                          </mwc-tab>
                          <mwc-tab .label=${this.t('evees:permissions')} hasImageIcon>
                            <mwc-icon>group</mwc-icon>
                          </mwc-tab>
                        </mwc-tab-bar>

                        <div class="tab-content-container">
                          <div class="tab-content">
                            ${this.renderTabContent()}
                          </div>
                        </div>
                      </div>
                    `
                  : ''}
              </mwc-card>
            `
          : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        height: 100%;
        width: 15px;
      }
      .button {
        height: calc(100% - 10px);
        margin-top: 5px;
        margin-left: 5px;
        width: 10px;
        border-radius: 3px;
        cursor: pointer;
      }
      .button:hover {
        background-color: #cccccc;
      }
      .popout {
        z-index: 20;
        position: absolute;
        left: 20px;
        top: 0;
      }
      .info-box {
        width: auto;
      }
      .perspective-details {
        flex-grow: 1;
        flex-direction: column;
        display: flex;
      }
      .perspective-details > span {
        padding-bottom: 4px;
      }
      .row {
        display: flex;
        flex-direction: row;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
      .perspective-title {
        padding: 16px;
        font-weight: bold;
        border-top-right-radius: 4px;
        border-top-left-radius: 4px;
      }
      .perspectives-list {
        border-bottom: solid 1px #d9d7d0;
        margin-bottom: 16px;
        flex-grow: 1;
      }
      .perspectives-permissions {
        flex-grow: 1;
      }
      .tab-content-container {
        min-height: 400px;
        display: flex;
        flex-direction: column;
      }
      .tab-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
    `;
  }
}
