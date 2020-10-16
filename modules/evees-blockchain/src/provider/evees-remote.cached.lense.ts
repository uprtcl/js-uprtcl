import { LitElement, property, html, css, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesBlockchainCached } from './evees.blockchain.cached';
import { UprtclDialog } from '@uprtcl/common-ui';

interface remoteUI {
  pendingActions: number;
}

export class EveesBlockchainCachedRemoteLense extends moduleConnect(LitElement) {

  @property({ type: String, attribute: 'remote-id'})
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  showDiff: boolean = false;

  @property({ attribute: false })
  remoteUI!: remoteUI;
  
  @property({ attribute: false })
  newHash!: string;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;
  
  client!: ApolloClient<any>;
  remote!: EveesBlockchainCached;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remotes = this.requestAll(EveesModule.bindings.EveesRemote) as EveesRemote[];
    this.remote = remotes.find(r => r.id.includes(this.remoteId)) as EveesBlockchainCached;
    await this.remote.ready();

    this.load();

    setInterval(() => {
      this.refresh();
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

  async remoteClicked() {
    this.loading = true;
    this.newHash = await this.remote.createNewEveesData();

    this.showDiff = true;
    await this.updateComplete;

    if (this.remote.isLogged()) {
      this.updatesDialogEl.primaryText = 'update';
      this.updatesDialogEl.secondaryText = 'close';
      this.updatesDialogEl.showSecondary = 'true';
    } else {
      this.updatesDialogEl.primaryText = 'close';
    }

    const value = await new Promise(resolve => {
      this.updatesDialogEl.resolved = value => {
        this.showDiff = false;
        resolve(value);
      };
    });

    this.showDiff = false;

    if (this.remote.isLogged() && value) {
      await this.remote.flushCache();
    }
    this.loading = false;
  }

  renderDiff() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-blockchain-update-diff 
          owner=${this.remote.userId as string} 
          remote=${this.remote.id} 
          new-hash=${this.newHash}>
        </evees-blockchain-update-diff>
      </uprtcl-dialog>
    `;
  }

  render() {
    return html`
      ${this.loading ? html`<uprtcl-loading></uprtcl-loading>` : html`<div @click=${() => this.remoteClicked()} class="status-container">
        ${this.remoteUI.pendingActions}
      </div>`}
      ${this.showDiff ? this.renderDiff() : ''}
    `;
  }

  static get styles() {
    return css`
      .status-container {
        height: 32px;
        width: 32px;
        border-radius: 16px;
        background-color: #2a3279;
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
