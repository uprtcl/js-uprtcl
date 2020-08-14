import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { eveeColor } from './support';

export const DEFAULT_COLOR = '#d0dae0';

interface PerspectiveData {
  id: string;
  name: string;
  remote: string;
  creatorId: string;
  timestamp: number;
  publicRead: boolean;
}

const MERGE_ACTION: string = 'Merge';
const MERGE_PROPOSAL_ACTION: string = 'Propose';
const PRIVATE_PERSPECTIVE: string = 'Private';

export class PerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ attribute: false })
  loadingPerspectives: boolean = true;

  perspectivesData: PerspectiveData[] = [];

  @property({ attribute: false })
  otherPerspectivesData: PerspectiveData[] = [];

  @property({ attribute: false })
  canWrite: Boolean = false;

  @property({ attribute: 'force-update' })
  forceUpdate: string = 'true';

  protected client!: ApolloClient<any>;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
  }

  async load() {
    this.loadingPerspectives = true;

    const client: ApolloClient<any> = this.request(
      ApolloClientModule.bindings.Client
    );
    const result = await client.query({
      query: gql`{
        entity(uref: "${this.perspectiveId}") {
          id
          ... on Perspective {
            payload {
              remote
            }
            context {
              id
              perspectives {
                id
                name
                payload {
                  creatorId
                  timestamp
                  remote
                }
                _context {
                  patterns {
                    accessControl {
                      permissions
                    }
                  }
                }
              } 
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
      }`,
    });

    /** data on this perspective */
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;

    /** data on other perspectives (proposals are injected on them) */
    this.perspectivesData =
      result.data.entity.context === null
        ? []
        : result.data.entity.context.perspectives.map(
            (perspective): PerspectiveData => {
              const publicRead =
                perspective._context.patterns.accessControl.permissions
                  .publicRead !== undefined
                  ? perspective._context.patterns.accessControl.permissions
                      .publicRead
                  : true;

              return {
                id: perspective.id,
                name: perspective.name,
                creatorId: perspective.payload.creatorId,
                timestamp: perspective.payload.timestamp,
                remote: perspective.payload.remote,
                publicRead: publicRead,
              };
            }
          );

    this.otherPerspectivesData = this.perspectivesData.filter(
      (perspectiveData) => perspectiveData.id !== this.firstPerspectiveId
    );

    this.loadingPerspectives = false;

    this.logger.info('getOtherPersepectives() - post', {
      persperspectivesData: this.perspectivesData,
    });
  }

  perspectiveClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('perspective-selected', {
        bubbles: true,
        composed: true,
        detail: {
          id,
        },
      })
    );
  }

  updated(changedProperties) {
    if (changedProperties.has('forceUpdate')) {
      this.logger.log('updating getOtherPersepectivesData');
      this.load();
    }
    if (
      changedProperties.has('perspectiveId') ||
      changedProperties.has('firstPerspectiveId')
    ) {
      this.logger.log('updating getOtherPersepectivesData');
      this.load();
    }
  }

  perspectiveColor(perspectiveId: string) {
    if (perspectiveId === this.firstPerspectiveId) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(perspectiveId);
    }
  }

  perspectiveButtonClicked(
    event: Event,
    action: string,
    perspectiveData: PerspectiveData
  ) {
    event.stopPropagation();
    switch (action) {
      case MERGE_ACTION:
        this.dispatchEvent(
          new CustomEvent('merge-perspective', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id,
            },
          })
        );
        break;

      case MERGE_PROPOSAL_ACTION:
        this.dispatchEvent(
          new CustomEvent('create-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id,
            },
          })
        );
        break;
    }
  }

  getPerspectiveAction(perspectiveData: PerspectiveData) {
    if (this.canWrite) {
      return MERGE_ACTION;
    } else {
      if (perspectiveData.publicRead) {
        return MERGE_PROPOSAL_ACTION;
      } else {
        return PRIVATE_PERSPECTIVE;
      }
    }
  }

  getPerspectiveActionDisaled(perspectiveData: PerspectiveData) {
    return [MERGE_ACTION, PRIVATE_PERSPECTIVE].includes(
      this.getPerspectiveAction(perspectiveData)
    );
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <cortex-loading-placeholder></cortex-loading-placeholder>
      </div>
    `;
  }

  renderPerspectiveRow(perspectiveData: PerspectiveData) {
    const action = this.getPerspectiveAction(perspectiveData);
    return html`
      <mwc-list-item
        hasMeta
        ?selected=${this.perspectiveId === perspectiveData.id}
        ?activated=${this.perspectiveId === perspectiveData.id}
        @click=${() => this.perspectiveClicked(perspectiveData.id)}
      >
        <evees-author
          color=${this.perspectiveColor(perspectiveData.id)}
          user-id=${perspectiveData.creatorId}
        ></evees-author>

        ${!this.getPerspectiveActionDisaled(perspectiveData)
          ? html` <mwc-icon
              slot="meta"
              @click=${(e) =>
                this.perspectiveButtonClicked(e, action, perspectiveData)}
            >
              call_merge
            </mwc-icon>`
          : ''}
      </mwc-list-item>
    `;
  }

  render() {
    return this.loadingPerspectives
      ? this.renderLoading()
      : this.otherPerspectivesData.length > 0
      ? html`
          <mwc-list activatable>
            ${this.otherPerspectivesData.map((perspectiveData) =>
              this.renderPerspectiveRow(perspectiveData)
            )}
          </mwc-list>
        `
      : html`<div class="empty"><i>No other perspectives found</i></div>`;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }

      .loading-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .empty {
        margin-top: 60px;
        color: #d0d8db;
        text-align: center;
      }
    `;
  }
}
