import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { EveesModule } from '@uprtcl/evees';

import { EveesBlockchainCached } from '../provider/evees.blockchain.cached';

interface RemoteUI {
  pendingActions: number;
}

export class EveesBlockchainStatus extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-BLOCKCHAIN-STATUS');

  @property({ type: String, attribute: 'remote' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  applying: boolean = false;

  @property({ attribute: false })
  deleting: boolean = false;

  @property({ attribute: false })
  remoteUI!: RemoteUI;

  protected remote!: EveesBlockchainCached;

  async firstUpdated() {
    const remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesBlockchainCached[]).find(r => r.id === this.remoteId);
    if (!remote) {
      throw new Error(`remote ${this.remoteId} not found`);
    }

    this.remote = remote;
    this.load();
  }

  async load() {
    this.loading = true;
    this.loading = false;
  }

  async applyChanges() {
    this.applying = true;
    await this.remote.flushCache();
    this.applying = false;
  }

  async deleteAll() {
    this.deleting = true;
    this.remote.updateHead(undefined);
    this.deleting = false;
    this.load();
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    return html`
      <div class="row">
        <evees-blockchain-update-diff
          owner=${this.remote.userId as string}
          remote=${this.remote.id}
        >
        </evees-blockchain-update-diff>
        <uprtcl-button @click=${() => this.applyChanges()}>apply changes</uprtcl-button>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        text-align: center;
      }
      .row {
        width: 100%;
        height: 50vh;
        display: flex;
        flex-direction: column;
      }
      evees-blockchain-update-diff {
        flex-grow: 1;
        overflow: auto;
      }
      uprtcl-button {
        margin: 0 auto;
        margin-top: 16px;
      }
    `;
  }
}
