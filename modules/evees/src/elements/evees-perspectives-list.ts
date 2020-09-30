import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { eveeColor } from './support';
import { EveesBindings } from './../bindings';
import { EveesRemote } from './../services/evees.remote';

export const DEFAULT_COLOR = '#d0dae0';

interface PerspectiveData {
  id: string;
  name: string;
  remote: string;
  creatorId: string;
  timestamp: number;
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

  @property({ type: Boolean, attribute: 'can-propose' })
  canPropose: Boolean = false;

  @property({ attribute: false })
  loadingPerspectives: boolean = true;

  @property({ attribute: false })
  otherPerspectivesData: PerspectiveData[] = [];

  @property({ attribute: false })
  canWrite: Boolean = false;

  @property({ attribute: 'force-update' })
  forceUpdate: string = 'true';

  perspectivesData: PerspectiveData[] = [];

  protected client!: ApolloClient<any>;

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loadingPerspectives = true;
    const result = await this.client.query({
      query: gql`{
        entity(uref: "${this.perspectiveId}") {
          id
          ... on Perspective {
            payload {
              remote
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
                } 
              }
            }
          }
        }
      }`
    });

    /** data on other perspectives (proposals are injected on them) */
    this.perspectivesData =
      result.data.entity.payload.context === null
        ? []
        : await Promise.all(
            result.data.entity.payload.context.perspectives.map(
              async (perspective): Promise<PerspectiveData> => {
                /** data on this perspective */
                const remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
                  r => r.id === perspective.payload.remote
                );
                if (!remote) throw new Error(`remote not found for ${perspective.payload.remote}`);
                this.canWrite = await remote.canWrite(this.perspectiveId);
                return {
                  id: perspective.id,
                  name: perspective.name,
                  creatorId: perspective.payload.creatorId,
                  timestamp: perspective.payload.timestamp,
                  remote: perspective.payload.remote
                };
              }
            )
          );

    this.otherPerspectivesData = this.perspectivesData.filter(
      perspectiveData => perspectiveData.id !== this.firstPerspectiveId
    );

    this.loadingPerspectives = false;

    this.logger.info('getOtherPersepectives() - post', {
      persperspectivesData: this.perspectivesData
    });
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

  updated(changedProperties) {
    if (changedProperties.has('forceUpdate')) {
      this.logger.log('updating getOtherPersepectivesData');
      this.load();
    }
    if (changedProperties.has('perspectiveId') || changedProperties.has('firstPerspectiveId')) {
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

  perspectiveButtonClicked(event: Event, perspectiveData: PerspectiveData) {
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('merge-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          perspectiveId: perspectiveData.id
        }
      })
    );
  }

  getPerspectiveAction(perspectiveData: PerspectiveData) {
    if (this.canWrite) {
      return MERGE_ACTION;
    } else {
      return MERGE_PROPOSAL_ACTION;
    }
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <uprtcl-loading></uprtcl-loading>
      </div>
    `;
  }

  renderPerspectiveRow(perspectiveData: PerspectiveData) {
    return html`
      <uprtcl-list-item
        style=${`--selected-border-color: ${this.perspectiveColor(perspectiveData.id)}`}
        hasMeta
        ?selected=${this.perspectiveId === perspectiveData.id}
        @click=${() => this.perspectiveClicked(perspectiveData.id)}
      >
        <evees-author
          show-name
          color=${this.perspectiveColor(perspectiveData.id)}
          user-id=${perspectiveData.creatorId}
        ></evees-author>

        <!-- just enable merges to the official perspective for now -->
        ${this.canPropose && this.perspectiveId === this.firstPerspectiveId
          ? html`
              <uprtcl-button
                slot="meta"
                icon="call_merge"
                skinny
                @click=${e => this.perspectiveButtonClicked(e, perspectiveData)}
              >
                merge
              </uprtcl-button>
            `
          : ''}
      </uprtcl-list-item>
    `;
  }

  render() {
    return this.loadingPerspectives
      ? this.renderLoading()
      : this.otherPerspectivesData.length > 0
      ? html`
          <uprtcl-list activatable>
            ${this.otherPerspectivesData.map(perspectiveData =>
              this.renderPerspectiveRow(perspectiveData)
            )}
          </uprtcl-list>
        `
      : html`
          <div class="empty"><i>No other perspectives found</i></div>
        `;
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
