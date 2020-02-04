import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';
import { randomColor } from 'randomcolor';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Proposal } from '../types';
import { styleMap } from './evees-info';
import { DEFAULT_COLOR } from './evees-perspective';

interface PerspectiveData {
  id: string;
  name: string;
  creatorId: string;
  timestamp: number;
  proposal: Proposal | undefined;
}

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

  mergeClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('merge-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          id
        }
      })
    );
  }

  getProposalAction(proposal: Proposal | undefined): string {
    if (proposal === undefined) return 'Merge';
    if (proposal !== undefined) {
      if (!proposal.authorized) {
        if (proposal.canAuthorize) {
          return 'Authorize';
        } else {
          return 'Pending';
        }
      }
    }
    return '';
  }

  getOtherPersepectivesData = async () => {
    this.loading = true;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              context {
                perspectives {
                  id
                  name
                  payload {
                    creatorId
                    timestamp
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
          }
        }`
    });
    result.data.entity.context.perspectives.map(p => p.id);
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
          proposal: thisProposal
        };
      });

    this.loading = false;
    this.logger.info('getOtherPersepectives() - post', {
      persperspectivesData: this.perspectivesData
    });
  };

  perspectiveTitle(perspectivesData: PerspectiveData) {
    return `${perspectivesData.name} by ${perspectivesData.creatorId.substr(0, 6)} on ${perspectivesData.timestamp}`;
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
      loading perspectives data ...<mwc-circular-progress></mwc-circular-progress>
    `;
  }

  render() {
    return this.loading
      ? this.renderLoading()
      : html`
          ${this.perspectivesData.length > 0
          ? html`
                <mwc-list>
                  ${this.perspectivesData.map((perspectiveData: PerspectiveData) => {
                    return html`
                      <div class="row">
                        <mwc-list-item class="perspective-title" @click=${() => this.perspectiveClicked(perspectiveData.id)}>
                          <div
                            class="perspective-mark"
                            style=${styleMap({ backgroundColor: this.perspectiveColor(perspectiveData.id) })})
                          ></div>
                          <span class="perspective-name"
                            >${this.perspectiveTitle(perspectiveData)}</span
                          >
                        </mwc-list-item>
                        <mwc-button
                          icon="call_merge"
                          @click=${() => this.mergeClicked(perspectiveData.id)}
                          label=${this.getProposalAction(perspectiveData.proposal)}
                        ></mwc-button>
                      </div>
                    `;
                  })}
                </mwc-list>
              `
          : html`
                <span>There are no other perspectives for this context</span>
              `}
        `;
  }

  static get styles() {
    return css`
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
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

      .perspective-title {
        flex: 1;
      }
    `;
  }
}
