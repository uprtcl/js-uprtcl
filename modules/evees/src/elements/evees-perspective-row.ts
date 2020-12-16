import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { eveeColor } from './support';

interface PerspectiveData {
    id: string;
    name: string;
    remote: string;
    creatorId: string;
    timestamp: number;
}

export class EveesPerspectiveRow extends moduleConnect(LitElement) {
    logger = new Logger('EVEES-PERSPECTIVE-ROW');

    @property({ type: String, attribute: 'perspective-id' })
    perspectiveId!: string;

    @property({ type: Boolean, attribute: 'has-meta' })
    hasMeta!: boolean;

    @property({ type: String, attribute: 'perspective-data-id' })
    perspectiveDataId!: string;

    @property({ type: String, attribute: 'creator-id' })
    creatorId!: string;

    @property({ type: String, attribute: 'remote-id' })
    remoteId!: string;

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

    render() {        
        return html`
            <uprtcl-list-item
              style=${`--selected-border-color: ${this.perspectiveColor(
                  this.creatorId
              )}`}
              hasMeta
              ?selected=${this.perspectiveId === this.perspectiveDataId}
              @click=${() => this.perspectiveClicked(this.perspectiveDataId)}
            >
                <evees-author
                  show-name
                  color=${this.perspectiveColor(this.creatorId)}
                  user-id=${this.creatorId}
                  remote-id=${this.remoteId}
                ></evees-author>
            </uprtcl-list-item>
        `
    }

    static get styles() {
        return css`
          uprtcl-list-item {
            user-select: none;
          }
          uprtcl-list-item evees-author {
            width: 100%;
          }
        `;
      }
}