import { LitElement, property, html, css, internalProperty } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesBlockchainCached } from './evees.blockchain.cached';
import { MenuConfig } from '@uprtcl/common-ui';
import { ChainConnectionDetails, RemoteUI } from '../types';
import { error } from 'console';

export class EveesBlockchainCachedRemoteLense extends moduleConnect(
  LitElement
) {
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

  @internalProperty()
  settingCustom: boolean = false;

  client!: ApolloClient<any>;
  remote!: EveesBlockchainCached;
  dialogOptions: MenuConfig = {
    close: {
      text: 'close',
      icon: 'clear',
      skinny: false,
    },
  };
  currentConnection!: ChainConnectionDetails;
  connections!: ChainConnectionDetails[];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remotes = this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[];
    this.remote = remotes.find((r) =>
      r.id.includes(this.remoteId)
    ) as EveesBlockchainCached;

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
      pendingActions: status.pendingActions,
    };
  }

  async load() {
    this.loading = true;
    this.currentConnection = this.remote.connection.connection.connectionDetails;
    this.connections = this.remote.connection.connection.connections;

    await this.refresh();
    this.loading = false;
  }

  setCustomEndpoint(endpoint: string) {
    localStorage.setItem('POLKADOT-CONNECTION-NAME', 'CUSTOM');
    localStorage.setItem('POLKADOT-CONNECTION-ENDPOINT', endpoint);
    location.reload();
  }

  chainSelected(connectionId) {
    localStorage.setItem('POLKADOT-CONNECTION-NAME', connectionId);
    location.reload();
  }

  customSelected() {
    if (!this.settingCustom) {
      this.settingCustom = true;
    }
  }

  cancelSettingCustom(e) {
    /** ugly hack to let customSelect being called before */
    setTimeout(() => (this.settingCustom = false), 100);
  }

  renderChain() {
    return html`
      ${this.remote.userId
        ? html`
            <div class="flex-center">
              Logged as
              <evees-author
                class="margin-left"
                user-id=${this.remote.userId as string}
                remote-id=${this.remote.id}
                show-name
              ></evees-author>
            </div>
          `
        : ''}
      ${this.connections
        ? html`
            <uprtcl-popper class="connections-popper">
              <uprtcl-button slot="icon"
                >${this.currentConnection.name}
                <span class="endpoint-button"
                  >(${this.currentConnection.endpoint})</span
                ></uprtcl-button
              >
              <uprtcl-list>
                ${Object.getOwnPropertyNames(this.connections).map(
                  (connectionId) => {
                    const connectionDetails = this.connections[connectionId];
                    return html`
                      <uprtcl-list-item
                        @click=${() => this.chainSelected(connectionId)}
                        >${connectionDetails.name}
                        <span class="endpoint"
                          >(${connectionDetails.endpoint})</span
                        ></uprtcl-list-item
                      >
                    `;
                  }
                )}
                ${this.settingCustom
                  ? html`
                      <uprtcl-list-item @click=${() => this.customSelected()}>
                        <uprtcl-form-string
                          value=""
                          label="Enpoint"
                          @cancel=${(e) => this.cancelSettingCustom(e)}
                          @accept=${(e) =>
                            this.setCustomEndpoint(e.detail.value)}
                        ></uprtcl-form-string
                      ></uprtcl-list-item>
                    `
                  : html`
                      <uprtcl-list-item @click=${() => this.customSelected()}>
                        Custom</uprtcl-list-item
                      >
                    `}
              </uprtcl-list>
            </uprtcl-popper>
          `
        : ``}
    `;
  }

  renderStatus() {
    return html`
      <uprtcl-dialog
        .options=${this.dialogOptions}
        @option-selected=${() => (this.showDiff = false)}
      >
        <div class="dialog-element">
          <div class="chain-row">${this.renderChain()}</div>
          <evees-blockchain-status remote=${this.remote.id}>
          </evees-blockchain-status>
        </div>
      </uprtcl-dialog>
    `;
  }

  render() {
    return html`
      ${this.loading
        ? html` <uprtcl-loading></uprtcl-loading> `
        : html`
            <div class="container">
              <evees-author
                user-id=${this.remote.userId as string}
                remote-id=${this.remote.id}
              ></evees-author>
              <div
                @click=${() => (this.showDiff = true)}
                class=${`status-container ${
                  this.remoteUI.pendingActions > 0 ? 'status-pending' : ''
                }`}
              >
                ${this.remoteUI.pendingActions > 0
                  ? this.remoteUI.pendingActions
                  : ''}
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
      .chain-row {
        display: flex;
        margin-bottom: 16px;
        justify-content: space-between;
      }
      .margin-left {
        margin-left: 8px;
      }
      .endpoint-button {
        font-size: 13px;
        margin-left: 6px;
        color: #a9d5f9;
      }
      .endpoint {
        color: #868686;
        font-size: 13px;
        margin-left: 6px;
      }
      .flex-center {
        display: flex;
        align-items: center;
      }
      .connections-popper {
        --box-width: 380px;
        margin-right: 4px;
      }
      .dialog-element {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
      }
      evees-blockchain-status {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    `;
  }
}
