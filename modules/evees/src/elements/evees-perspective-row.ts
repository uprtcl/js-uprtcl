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

  @property({ type: String, attribute: 'parent-context' })
  parentContext!: string;

  @property({ type: String, attribute: 'context' })
  context!: string;

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: Boolean, attribute: 'has-meta' })
  hasMeta!: boolean;

  @property({ type: String, attribute: 'other-perspective-id' })
  otherPerspectiveId!: string;

  @property({ type: String, attribute: 'creator-id' })
  creatorId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ type: String, attribute: 'title' })
  title!: string;

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
        style=${`--selected-border-color: ${this.perspectiveColor(this.creatorId)}`}
        hasMeta
        ?selected=${this.perspectiveId === this.otherPerspectiveId}
        @click=${() => this.perspectiveClicked(this.otherPerspectiveId)}
      >
        ${this.context !== this.parentContext && this.title !== undefined
          ? html` <div class="title"><b>Title</b>: ${this.title} | Created by</div> `
          : html` <div class="title no-title">Created by</div> `}
        <evees-author
          show-name
          color=${this.perspectiveColor(this.creatorId)}
          user-id=${this.creatorId}
          remote-id=${this.remoteId}
        ></evees-author>
      </uprtcl-list-item>
    `;
  }

  static get styles() {
    return css`
      uprtcl-list-item {
        user-select: none;
      }
      uprtcl-list-item evees-author {
        width: 100%;
      }
      .title {
        padding: 6px 10px 0px 0px;
      }
      .no-title {
        color: #868686;
      }
    `;
  }
}
