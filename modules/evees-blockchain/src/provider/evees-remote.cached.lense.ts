import { LitElement, property, html, css, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesBlockchainCached } from './evees.blockchain.cached';
import { MenuConfig, UprtclDialog } from '@uprtcl/common-ui';

interface RemoteUI {
  pendingActions: number;
}

export class EveesBlockchainCachedRemoteLense extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  showDiff: boolean = false;

  @property({ attribute: false })
  remoteUI!: RemoteUI;

  @property({ attribute: false })
  newHash!: string;

  client!: ApolloClient<any>;
  remote!: EveesBlockchainCached;
  dialogOptions: MenuConfig = {
    close: {
      text: 'close',
      icon: 'clear',
      skinny: false
    }
  };

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remotes = this.requestAll(EveesModule.bindings.EveesRemote) as EveesRemote[];
    this.remote = remotes.find(r => r.id.includes(this.remoteId)) as EveesBlockchainCached;
    await this.remote.ready();

    this.load();

    setInterval(() => {
      if (!this.showDiff) {
        this.refresh();
      }
    }, 1000);
  }

  async refresh() {
    const status = await this.remote.getStatus();
    this.remoteUI = {
      pendingActions: status.pendingActions
    };
  }

  async load() {
    this.loading = true;
    await this.refresh();
    this.loading = false;
  }

  renderDiff() {
    return html`
      <uprtcl-dialog
        .options=${this.dialogOptions}
        @option-selected=${() => (this.showDiff = false)}
      >
        <evees-blockchain-status remote=${this.remote.id}> </evees-blockchain-status>
      </uprtcl-dialog>
    `;
  }

  render() {
    return html`
      ${this.loading
        ? html`
            <uprtcl-loading></uprtcl-loading>
          `
        : html`
            <div class="container">
              <evees-author user-id=${this.remote.userId as string}></evees-author>
              <div @click=${() => (this.showDiff = true)} class="status-container">
                ${this.remoteUI.pendingActions}
              </div>
            </div>
          `}
      ${this.showDiff ? this.renderDiff() : ''}
    `;
  }

  static get styles() {
    return css`
      .container {
        position: relative;
      }
      .status-container {
        position: absolute;
        top: 0;
        left: 0;
        height: 32px;
        width: 32px;
        border-radius: 16px;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
    `;
  }
}
