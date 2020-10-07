import { LitElement, property, internalProperty, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { EveesRemote } from '../services/evees.remote';
import { EveesBindings } from '../bindings';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';

export class EveesLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-LOGIN');

  @property({ attribute: false })
  logged!: boolean;

  @property({ attribute: false })
  userIds: string[] = [];

  remotes!: EveesRemote[];
  client!: ApolloClient<any>;

  @internalProperty()
  private showAccountSelection: boolean = false;

  async firstUpdated() {
    this.remotes = this.requestAll(EveesBindings.EveesRemote);
    this.client = this.request(ApolloClientModule.bindings.Client);
    await Promise.all(this.remotes.map(async (remote) => {
      await remote.getAccounts?.();
    }));
    await this.checkLogged();
  }

  async checkLogged() {
    const loggedList = await Promise.all(
      this.remotes.map((remote) => remote.isLogged())
    );
    this.userIds = [];
    this.remotes.map((remote) => {
      if (remote.userId !== undefined) this.userIds.push(remote.userId);
    });
    this.logged = !loggedList.includes(false);
    this.dispatchEvent(new CustomEvent('logged-in'));
  }

  async login(account: string) {
    this.userIds = [];
    await Promise.all(
      this.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        // TODO: pass in account to polkadot remote only
        if (!isLogged) await remote.login(account);
      })
    );
    /** invalidate all the cache :) */
    await this.client.resetStore();
    await this.checkLogged();
    this.showAccountSelection = false;
  }

  async onLoginClick() {
    this.showAccountSelection = true;
  }

  async logoutAll() {
    await Promise.all(
      this.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        if (isLogged) {
          try {
            await remote.logout();
          } catch (e) {
            // TODO: dont swallow errors
          }
        }
      })
    );
    await this.checkLogged();
  }

  render() {
    return html`
        ${this.logged ? html`<uprtcl-button @click=${() => this.logoutAll()}>logout</uprtcl-button>`
      : html`<uprtcl-button @click=${() => this.onLoginClick()}>login</uprtcl-button>`}
        ${this.showAccountSelection ? html`
        <uprtcl-dialog .actions=${false}>
          <h1 class="account-list-title">Select account</h1>
          <uprtcl-list class="account-list-item">
            ${this.remotes?.map(remote => remote.accounts?.map(account => html`
              <uprtcl-list-item @click=${() => this.login(account)}>${account}</uprtcl-list-item>
            `))}
          </uprtcl-list>
        </uprtcl-dialog>
        ` : ''}
      `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }

      .account-list-title {
        text-align: center;
      }

      uprtcl-button {
        margin-right: 10px;
      }
    `;
  }
}
