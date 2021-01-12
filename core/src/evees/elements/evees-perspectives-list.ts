import { LitElement, property, html, css } from 'lit-element';

import { eveeColor } from './support';
import { RemoteEvees } from '../../services/remote.evees';
import { Client } from '../interfaces/client';
import { eveesConnect } from 'src/container/evees-connect.mixin';

interface PerspectiveData {
  id: string;
  name: string;
  remote: string;
  creatorId: string;
  timestamp: number;
}

export class EveesPerspectivesList extends eveesConnect(LitElement) {
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
  canUpdate: Boolean = false;

  perspectivesData: PerspectiveData[] = [];

  async load() {
    this.loadingPerspectives = true;
    const otherPerspectivesIds = await this.getEvees().client.searchEngine.otherPerspectives(
      this.perspectiveId
    );

    const perspectivesData: PerspectiveData[] = await Promise.all(
      otherPerspectivesIds.map(
        async (perspective): Promise<PerspectiveData> => {
          /** data on this perspective */
          const remote = this.evees.remotes.find((r) => r.id === perspective.payload.remote);
          if (!remote) throw new Error(`remote not found for ${perspective.payload.remote}`);
          this.canUpdate = await this.evees.client.getPerspective(this.perspectiveId);
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
    perspectivesData.forEach((perspectiveData) => map.set(perspectiveData.id, perspectiveData));
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
            ${this.otherPerspectivesData.map(
              (perspectiveData) =>
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
