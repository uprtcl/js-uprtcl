import { LitElement, property, html, css } from 'lit-element';

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

  async firstUpdated() {
    this.remotes = this.requestAll(EveesBindings.EveesRemote);
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.checkLogged();
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

  async loginAll() {
    this.userIds = [];
    await Promise.all(
      this.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        if (!isLogged) await remote.login();
      })
    );
    /** invalidate all the cache :) */
    await this.client.resetStore();
    this.checkLogged();
  }

  async logoutAll() {
    await Promise.all(
      this.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        if (isLogged) await remote.logout();
      })
    );
    this.checkLogged();
  }

  render() {
    if (this.logged) {
      return html`
        <uprtcl-button @click=${() => this.logoutAll()}>logout</uprtcl-button
        >${this.userIds.map(
          (userId) => html`<evees-author user-id=${userId}></evees-author>`
        )}
      `;
    } else {
      return html`
        <uprtcl-button @click=${() => this.loginAll()}>login</uprtcl-button>
      `;
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }

      uprtcl-button {
        margin-right: 10px;
      }
    `;
  }
}
