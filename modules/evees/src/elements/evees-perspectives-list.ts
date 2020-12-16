import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { eveeColor } from './support';
import { EveesBindings } from './../bindings';
import { EveesRemote } from './../services/evees.remote';
import { EveesHelpers } from '../graphql/evees.helpers';

interface PerspectiveData {
  id: string;
  name: string;
  remote: string;
  creatorId: string;
  timestamp: number;
}

export class EveesPerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: Array })
  hidePerspectives: string[] = [];

  @property({ type: Boolean, attribute: 'can-propose' })
  canPropose: Boolean = false;

  @property({ attribute: false })
  loadingPerspectives: boolean = true;

  @property({ attribute: false })
  otherPerspectivesData: PerspectiveData[] = [];

  @property({ attribute: false })
  canWrite: Boolean = false;

  perspectivesData: PerspectiveData[] = [];

  protected client!: ApolloClient<any>;
  protected remotes!: EveesRemote[];

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(ApolloClientModule.bindings.Client);
    this.remotes = this.requestAll(EveesBindings.EveesRemote) as EveesRemote[];
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
      }`,
    });

    /** data on other perspectives (proposals are injected on them) */
    const perspectivesData: PerspectiveData[] =
      result.data.entity.payload.context === null
        ? []
        : await Promise.all(
            result.data.entity.payload.context.perspectives.map(
              async (perspective): Promise<PerspectiveData> => {
                /** data on this perspective */
                const remote = this.remotes.find(
                  (r) => r.id === perspective.payload.remote
                );
                if (!remote)
                  throw new Error(
                    `remote not found for ${perspective.payload.remote}`
                  );
                this.canWrite = await EveesHelpers.canWrite(
                  this.client,
                  this.perspectiveId
                );
                return {
                  id: perspective.id,
                  name: perspective.name,
                  creatorId: perspective.payload.creatorId,
                  timestamp: perspective.payload.timestamp,
                  remote: perspective.payload.remote,
                };
              }
            )
          );

    // remove duplicates
    const map = new Map<string, PerspectiveData>();
    perspectivesData.forEach((perspectiveData) =>
      map.set(perspectiveData.id, perspectiveData)
    );
    this.perspectivesData = Array.from(map, (key) => key[1]);

    this.otherPerspectivesData = this.perspectivesData.filter(
      (perspectiveData) => !this.hidePerspectives.includes(perspectiveData.id)
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

  perspectiveColor(creatorId: string) {
    return eveeColor(creatorId);
  }

  perspectiveButtonClicked(event: Event, perspectiveData: PerspectiveData) {
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('merge-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          perspectiveId: perspectiveData.id,
        },
      })
    );
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <uprtcl-loading></uprtcl-loading>
      </div>
    `;
  }

  render() {    
    return this.loadingPerspectives
      ? this.renderLoading()
      : this.otherPerspectivesData.length > 0
      ? html`
          <uprtcl-list activatable>
            ${this.otherPerspectivesData.map((perspectiveData) =>              
              html`
                <evees-perspective-row
                  perspective-id=${this.perspectiveId}
                  hasMeta
                  perspective-data-id=${perspectiveData.id}
                  creator-id=${perspectiveData.creatorId}
                  remote-id=${perspectiveData.remote}
                ></evees-perspective-row>
              `
            )}
          </uprtcl-list>
        `
      : html`
          <uprtcl-list-item>
            <i>No other perspectives found</i>
          </uprtcl-list-item>
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
      uprtcl-list-item {
        user-select: none;
      }
      uprtcl-list-item evees-author {
        width: 100%;
      }
    `;
  }
}
