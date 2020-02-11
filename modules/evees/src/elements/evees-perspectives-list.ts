import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';
import { randomColor } from 'randomcolor';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Proposal } from '../types';
import { styleMap } from './evees-info-popper';
import { DEFAULT_COLOR } from './evees-perspective';
import { prettyTime, prettyAddress } from './support';

interface PerspectiveData {
  id: string;
  name: string;
  origin: string;
  creatorId: string;
  timestamp: number;
  proposal: Proposal | undefined;
}

const MERGE_ACTION: string = 'Merge';
const PENDING_ACTION: string = 'Pending';
const AUTHORIZE_ACTION: string = 'Authorize';
const EXECUTE_ACTION: string = 'Execute';
const MERGE_PROPOSAL_ACTION: string = 'Propose Merge';

export class PerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: Boolean, attribute: false })
  loading: boolean = true;

  @property({ type: String, attribute: false })
  perspectivesData: PerspectiveData[] = [];

  @property({ type: String, attribute: false })
  canWrite: Boolean = false;

  async firstUpdated() {
    this.getOtherPersepectivesData();
  }

  perspectiveClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('perspective-selected', {
        bubbles: true,
        composed: true,
        detail: {
          id
        }
      })
    );
  }

  buttonClicked(perspectiveData: PerspectiveData) {
    switch (this.getProposalAction(perspectiveData.proposal)) {
      case MERGE_ACTION:
        this.dispatchEvent(
          new CustomEvent('merge-perspective', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id
            }
          })
        );
        break;

      case MERGE_PROPOSAL_ACTION:
        this.dispatchEvent(
          new CustomEvent('create-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id
            }
          })
        );
        break;

      case AUTHORIZE_ACTION:
        if (!perspectiveData.proposal) return;
        this.dispatchEvent(
          new CustomEvent('authorize-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              proposalId: perspectiveData.proposal.id
            }
          })
        );
        break;

      case EXECUTE_ACTION:
        if (!perspectiveData.proposal) return;
        this.dispatchEvent(
          new CustomEvent('execute-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              proposalId: perspectiveData.proposal.id
            }
          })
        );
        break;
    }
  }

  getProposalAction(proposal: Proposal | undefined): string {
    if (proposal === undefined) {
      if (this.canWrite) {
        return MERGE_ACTION;
      } else {
        return MERGE_PROPOSAL_ACTION;
      }
    }

    if (!proposal.authorized) {
      if (proposal.canAuthorize) {
        return AUTHORIZE_ACTION;
      } else {
        return PENDING_ACTION;
      }
    } else {
      return EXECUTE_ACTION;
    }
  }

  getOtherPersepectivesData = async () => {
    this.loading = true;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              payload {
                origin
              }
              context {
                id
                perspectives {
                  id
                  name
                  payload {
                    creatorId
                    timestamp
                    origin
                  }
                } 
              }
              proposals {
                id
                fromPerspective {
                  id
                }
                authorized
                canAuthorize
                executed
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
        }`
    });

    /** data on this perspective */
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;

    const proposals = result.data.entity.proposals.map(
      (prop): Proposal => {
        return {
          id: prop.id,
          fromPerspectiveId: prop.fromPerspective.id,
          authorized: prop.authorized,
          canAuthorize: prop.canAuthorize,
          executed: prop.exectude
        };
      }
    );

    /** data on other perspectives (proposals are injected on them) */

    this.perspectivesData = result.data.entity.context.perspectives
      .filter(perspective => perspective.id !== this.perspectiveId)
      .map(perspective => {
        /** search for proposals from this perspective */
        const thisProposal: Proposal | undefined = proposals.find(
          proposal => proposal.fromPerspectiveId === perspective.id
        );
        return {
          id: perspective.id,
          name: perspective.name,
          creatorId: perspective.payload.creatorId,
          timestamp: perspective.payload.timestamp,
          origin: perspective.payload.origin,
          proposal: thisProposal
        };
      });

    this.loading = false;
    this.logger.info('getOtherPersepectives() - post', {
      persperspectivesData: this.perspectivesData
    });
  };

  perspectiveTitle(perspectivesData: PerspectiveData) {
    return html`
      ${perspectivesData.name !== ''
        ? html`
            <strong>${perspectivesData.name}</strong>
          `
        : 'created'}
      by ${prettyAddress(perspectivesData.creatorId)} ${prettyTime(perspectivesData.timestamp)}
    `;
  }

  perspectiveColor(perspectiveId: string) {
    if (perspectiveId === this.firstPerspectiveId) {
      return DEFAULT_COLOR;
    } else {
      return randomColor({ seed: perspectiveId });
    }
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <cortex-loading-placeholder></cortex-loading-placeholder>
      </div>
    `;
  }

  render() {
    return this.loading
      ? this.renderLoading()
      : html`
          ${this.perspectivesData.length > 0
            ? html`
                <mwc-list activatable>
                  ${this.perspectivesData.map(
                    (perspectiveData: PerspectiveData) => html`
                      <div class="list-row">
                        <div class="perspective-title">
                          <mwc-list-item
                            @click=${() => this.perspectiveClicked(perspectiveData.id)}
                            graphic="small"
                          >
                            <div
                              slot="graphic"
                              class="perspective-mark"
                              style="${styleMap({
                                backgroundColor: this.perspectiveColor(perspectiveData.id)
                              })})"
                            ></div>
                            <div>
                              <span class="perspective-name">
                                ${this.perspectiveTitle(perspectiveData)}
                              </span>
                            </div>
                          </mwc-list-item>
                        </div>
                        <div class="perspective-action">
                          <mwc-button
                            class="merge-button"
                            icon="call_merge"
                            class="merge-button"
                            @click=${() => this.buttonClicked(perspectiveData)}
                            label=${this.getProposalAction(perspectiveData.proposal)}
                            .disabled=${this.getProposalAction(perspectiveData.proposal) ===
                              PENDING_ACTION}
                          ></mwc-button>
                        </div>
                      </div>
                    `
                  )}
                </mwc-list>
              `
            : html`
                <div class="empty"><i>There are no other perspectives for this context</i></div>
              `}
        `;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
      }

      .loading-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .perspective-mark {
        height: 30px;
        width: 10px;
        border-radius: 4px;
        float: left;
      }

      .perspective-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        margin-left: 8px;
      }

      .list-row {
        width: 100%;
        display: flex;
      }

      .perspective-title {
        flex-grow: 1;
      }

      .perspective-action {
        display: flex;
        flex-direction: column;
        padding-right: 16px;
        justify-content: center;
      }

      .button-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-right: 16px;
      }

      .empty {
        margin-top: 60px;
        color: #d0d8db;
        text-align: center;
      }
    `;
  }
}
