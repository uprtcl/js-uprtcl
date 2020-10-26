import { Signed } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { loadEntity } from '@uprtcl/multiplatform';
import { ApolloClient } from 'apollo-boost';
import { LitElement, html, css, property } from 'lit-element';
import { EveesBindings } from 'src/bindings';
import { Secured } from 'src/uprtcl-evees';
import { EveesRemote } from '../services/evees.remote';
import { Perspective } from '../types';

export class EveesPerspectiveIcon extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  perspective!: Secured<Perspective>;
  remote!: EveesRemote;
  client!: ApolloClient<any>;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('perspectiveId')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    const perspective = await loadEntity<Signed<Perspective>>(this.client, this.perspectiveId);
    if (!perspective) throw new Error('perspective undefined');

    const remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
      r => r.id === perspective.object.payload.remote
    );
    if (!remote) throw new Error('remote undefined');

    this.perspective = perspective;
    this.remote = remote;
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }
    return html`
      ${this.perspective.object.payload.creatorId
        ? html`
            <div class="row">
              <b class="tag-text">by</b>
              <evees-author
                user-id=${this.perspective.object.payload.creatorId}
                show-name
              ></evees-author>
            </div>
          `
        : ''}
      <div class="row">
        <b class="tag-text">on</b>
        <div class="remote-icon">
          ${this.remote.icon
            ? html`
                ${this.remote.icon()}
              `
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
          align-items: center;
        }
        .row {
          display: flex;
          align-items: center;
        }
        .tag-text {
          color: #cccccc;
        }
        evees-author {
          margin-left: 8px;
        }
        .remote-icon {
          margin-left: 6px;
        }
      `
    ];
  }
}
