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

  protected remote!: EveesBlockchainCached;

  async firstUpdated() {
    const remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesBlockchainCached[]).find(r => r.id === this.remoteId);
    if (!remote) {
      throw new Error(`remote ${this.remoteId} not found`);
    }

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
      <div class="row margin-bottom">
        Logged as
        <evees-author
          class="margin-left"
          user-id=${this.remote.userId as string}
          show-name
        ></evees-author>
      </div>
      <div class="row">
        <evees-blockchain-update-diff
          owner=${this.remote.userId as string}
          remote=${this.remote.id}
        >
        </evees-blockchain-update-diff>
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
        display: flex;
        align-items: center;
      }
      .margin-bottom {
        margin-bottom: 25px;
      }
      .margin-left {
        margin-left: 10px;
      }
      evees-blockchain-update-diff {
        flex-grow: 1;
        overflow: auto;
      }
    `;
  }
}
