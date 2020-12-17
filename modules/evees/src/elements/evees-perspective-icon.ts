import { LitElement, html, css, property, query } from 'lit-element';

import { Signed } from '@uprtcl/cortex';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { loadEntity } from '@uprtcl/multiplatform';
import { EveesBindings } from 'src/bindings';

import { EveesRemote } from '../services/evees.remote';
import { Perspective } from '../types';
import { Secured } from '../utils/cid-hash';

export class EveesPerspectiveIcon extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  perspective!: Secured<Perspective>;
  remote!: EveesRemote;
  remotes!: EveesRemote[];
  client!: EveesClient;

  async firstUpdated() {
    this.client = this.request(EveesClientModule.bindings.Client);
    this.remotes = this.requestAll(EveesBindings.EveesRemote) as EveesRemote[];
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('perspectiveId')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    const perspective = await loadEntity<Signed<Perspective>>(
      this.client,
      this.perspectiveId
    );
    if (!perspective) throw new Error('perspective undefined');

    const remote = this.remotes.find(
      (r) => r.id === perspective.object.payload.remote
    );
    if (!remote) throw new Error('remote undefined');

    this.perspective = perspective;
    this.remote = remote;
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }
    return html`
      <div class="row">
        <b class="tag-text">id</b>
        <span class="perspective-id" id="perspective-id"
          >${this.perspectiveId.substr(0, 10)}...${this.perspectiveId.slice(
            this.perspectiveId.length - 10
          )}</span
        >
        <uprtcl-copy-to-clipboard
          text=${this.perspectiveId}
        ></uprtcl-copy-to-clipboard>
      </div>
      ${this.perspective.object.payload.creatorId
        ? html`
            <div class="row">
              <b class="tag-text">creator</b>
              ${this.remote.userId === this.perspective.object.payload.creatorId
                ? html` <b class="you-tag">you</b> `
                : html`
                    <evees-author
                      user-id=${this.perspective.object.payload.creatorId}
                      remote-id=${this.perspective.object.payload.remote}
                      show-name
                    ></evees-author>
                  `}
            </div>
          `
        : ''}
      <div class="row">
        <b class="tag-text">on</b>
        <div class="remote-icon">
          ${this.remote.icon
            ? html` ${this.remote.icon(this.perspective.object.payload.path)} `
            : html`
                remote
                <pre>${this.perspective.object.payload.remote}</pre>
              `}
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          width: fit-content;
          flex-direction: column;
          align-items: start;
          width: 100%;
          font-size: 15px;
        }
        .row {
          display: flex;
          align-items: center;
          height: 35px;
          width: 100%;
        }
        .tag-text {
          color: #cccccc;
          width: 50px;
          text-align: right;
          margin-right: 8px;
        }
        .you-tag {
          color: #abdaab;
        }
        .perspective-id {
          color: var(--color, rgb(99, 102, 104));
          font-weight: 600;
          letter-spacing: 0.015em;
          display: block;
          overflow: hidden;
          white-space: nowrap;
        }
        evees-author {
          height: 32px;
          width: 100%;
        }
        uprtcl-copy-to-clipboard {
          margin-left: auto;
        }
      `,
    ];
  }
}
