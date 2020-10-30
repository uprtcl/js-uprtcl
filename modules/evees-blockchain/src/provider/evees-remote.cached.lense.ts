import { LitElement, property, html, css, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesBlockchainCached } from './evees.blockchain.cached';
import { MenuConfig } from '@uprtcl/common-ui';
import { ChainConnectionDetails, RemoteUI } from '../types';

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
  currentConnection!: ChainConnectionDetails;
  connections!: ChainConnectionDetails[];

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
    this.currentConnection = this.remote.connection.connection.connectionDetails;
    this.connections = this.remote.connection.connection.connections;

    await this.refresh();
    this.loading = false;
  }

  chainSelected(chainDetails) {
    console.log({ chainDetails });
  }

  renderChain() {
    return html`
      ${this.remote.userId
        ? html`
            <div class="row margin-bottom">
              Logged as
              <evees-author
                class="margin-left"
                user-id=${this.remote.userId as string}
                show-name
              ></evees-author>
            </div>
          `
        : ''}
      <uprtcl-popper>
        <uprtcl-button slot="icon">${this.currentConnection.name}</uprtcl-button>
        <uprtcl-list>
          ${Object.getOwnPropertyNames(this.connections).map(connection => {
            const connectionDetails = this.connections[connection];
            return html`
              <uprtcl-list-item @click=${() => this.chainSelected(connectionDetails)}
                >${connectionDetails.name} (${connectionDetails.host})</uprtcl-list-item
              >
            `;
          })}
        </uprtcl-list>
      </uprtcl-popper>
    `;
  }

  renderStatus() {
    return html`
      <uprtcl-dialog
        .options=${this.dialogOptions}
        @option-selected=${() => (this.showDiff = false)}
      >
        <div class="row">${this.renderChain()}</div>
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
              <div
                @click=${() => (this.showDiff = true)}
                class=${`status-container ${
                  this.remoteUI.pendingActions > 0 ? 'status-pending' : ''
                }`}
              >
                ${this.remoteUI.pendingActions > 0 ? this.remoteUI.pendingActions : ''}
              </div>
            </div>
          `}
      ${this.showDiff ? this.renderStatus() : ''}
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
      .status-pending {
        background-color: #c93131c3;
      }
    `;
  }
}
