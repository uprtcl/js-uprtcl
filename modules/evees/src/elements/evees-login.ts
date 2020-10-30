import { LitElement, property, internalProperty, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { EveesRemote } from '../services/evees.remote';
import { EveesBindings } from '../bindings';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Lens } from '@uprtcl/lenses';

export class EveesLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-LOGIN');

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  logged!: boolean;

  remotes!: EveesRemote[];
  client!: ApolloClient<any>;

  @internalProperty()
  private showAccountSelection: boolean = false;

  async firstUpdated() {
    this.remotes = this.requestAll(EveesBindings.EveesRemote);
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loading = true;

    const loggedList = await Promise.all(this.remotes.map(remote => remote.isLogged()));
    this.logged = !loggedList.includes(false);

    await Promise.all(this.remotes.map(r => r.ready()));

    this.loading = false;
  }

  async reload() {
    await this.client.resetStore();
    this.dispatchEvent(new CustomEvent('changed'));
    await this.load();
  }

  async loginAll() {
    await Promise.all(
      this.remotes.map(async remote => {
        const isLogged = await remote.isLogged();
        if (!isLogged) await remote.login();
      })
    );
    this.reload();
  }

  async logoutAll() {
    await Promise.all(
      this.remotes.map(async remote => {
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
    this.reload();
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    if (!this.logged) {
      return html`
        <uprtcl-button @click=${() => this.loginAll()}>login</uprtcl-button>
      `;
    }

    return html`
      <uprtcl-button skinny @click=${() => this.logoutAll()}>logout</uprtcl-button>
      ${this.remotes.map(remote => {
        return remote.lense !== undefined
          ? remote.lense().render({ remoteId: remote.id })
          : html`
              <evees-author user-id=${remote.userId as string}></evees-author>
            `;
      })}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        align-items: center;
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
