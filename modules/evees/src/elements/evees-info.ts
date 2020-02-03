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

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';

import { UpdateRequest, RemotesConfig, RequestCreatedEvent, Proposal, Perspective, PerspectiveDetails } from '../types';
import { EveesBindings } from '../bindings';
import { EveesModule } from '../evees.module';
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import { MergeStrategy } from '../merge/merge-strategy';
import { Evees } from '../services/evees';

interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  canWrite: Boolean
}

export class EveesInfo extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ attribute: false })
  show: Boolean = false;

  @property({ attribute: false })
  loading: Boolean = true;

  perspectiveData!: PerspectiveData;

  firstUpdated() {}

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
                }
              }
            }
          }
        }
      `
    });

    this.perspectiveData = {
      id: result.data.entity.id,
      details: {
        context: result.data.entity.context.identifier,
        headId: result.data.entity.head.id,
        name: result.data.entity.name
      },
      perspective: result.data.entity.payload,
      canWrite: result.data.entity._context.patterns.accessControl
        ? result.data.entity._context.patterns.accessControl.canWrite
        : true
    };

    this.logger.info('load', { perspectiveData: this.perspectiveData });
    this.loading = false;
  }

  async merge(fromPerspectiveId: string) {
    if (!fromPerspectiveId) return;

    this.logger.info('merge()', { perspectiveId: this.perspectiveId, fromPerspectiveId });

    const merge: MergeStrategy = this.request(EveesBindings.MergeStrategy);
    const updateRequests = await merge.mergePerspectives(this.perspectiveId, fromPerspectiveId);
    console.log(updateRequests);
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

  async otherPerspectiveMerge(e: CustomEvent) {

    const fromPerspectiveId = e.detail.id;
    this.logger.info(`merge ${fromPerspectiveId} on ${this.perspectiveId}`);

    const merge: MergeStrategy = this.request(EveesBindings.MergeStrategy);
    const updateRequests = await merge.mergePerspectives(this.perspectiveId, e.detail.id);

    this.logger.info('merge computed', { updateRequests });

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

      const requestId = await remote.proposals.createProposal(
        fromPerspectiveId,
        this.perspectiveId,
        updatesByAuthority[authority]
      );

      this.logger.info('created proposal', { requestId, updateRequests });

      this.dispatchEvent(
        new RequestCreatedEvent({
          detail: { requestId },
          cancelable: true,
          composed: true,
          bubbles: true
        })
      );
    });
  }

  showClicked() {
    this.show = !this.show;
    if (this.show) this.load();
  }

  async newPerspectiveClicked() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

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
        }
      })
    );
  }

  perspectiveTitle () {
    return this.perspectiveData.details.name !== '' ? 
      this.perspectiveData.details.name : 
      `by ${this.perspectiveData.perspective.creatorId.substr(0, 6)} on ${this.perspectiveData.perspective.timestamp}`;
  }

  renderLoading() {
    return html`
      loading perspective data ...<mwc-circular-progress></mwc-circular-progress>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div
          class="button"
          style=${styleMap({ backgroundColor: this.eveeColor })}
          @click=${this.showClicked}
        ></div>
        ${this.show
          ? html`
              <mwc-card class="info-box">
                <div>
                  ${this.loading
                    ? this.renderLoading()
                    : html`
                        <div class="perspective-header" style=${styleMap({ backgroundColor: this.eveeColor })}>
                          <strong>${ this.perspectiveTitle() }</strong>
                        </div>
                        <div style="margin-top: 16px; margin-bottom: 16px;">
                          <evees-perspectives-list
                            perspective-id=${this.perspectiveId}
                            @perspective-selected=${this.otherPerspectiveClicked}
                            @merge-perspective=${this.otherPerspectiveMerge}
                          ></evees-perspectives-list>
                        </div>
                        <mwc-button
                          outlined
                          icon="call_split"
                          @click=${this.newPerspectiveClicked}
                          label="Create new perspective"
                        ></mwc-button>
                      `}
                </div>
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
      .info-box {
        width: 600px;
        z-index: 20;
        position: absolute;
        left: 20px;
        top: 0;
      }
      .perspective-details {
        flex-direction: column;
        display: flex;
      }
      .perspective-details > span {
        padding-bottom: 4px;
      }
      .perspective-header {
        padding: 16px 24px;
        color: white;
      }
    `;
  }
}
