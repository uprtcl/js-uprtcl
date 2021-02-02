import { LitElement, property, html, css } from 'lit-element';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { Logger } from '../../utils/logger';

import { Evees } from '../evees.service';
import { RemoteWithUI } from '../interfaces/remote.with-ui';

export class EveesLoginWidget extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-LOGIN');

  @property({ attribute: false })
  loading = true;

  @property({ attribute: false })
  logged!: boolean;

  evees!: Evees;

  async firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;

    const loggedList = await Promise.all(this.evees.remotes.map((remote) => remote.isLogged()));
    this.logged = !loggedList.includes(false);

    await Promise.all(this.evees.remotes.map((r) => r.ready()));

    this.loading = false;
  }

  async reload() {
    /** refresh details to include */
    await this.evees.client.refresh();
    this.dispatchEvent(new CustomEvent('changed'));
    await this.load();
  }

  async loginAll() {
    await Promise.all(
      this.evees.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        if (!isLogged) await remote.login();
      })
    );
    this.reload();
  }

  async logoutAll() {
    await Promise.all(
      this.evees.remotes.map(async (remote) => {
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
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    if (!this.logged) {
      return html` <uprtcl-button @click=${() => this.loginAll()}>login</uprtcl-button> `;
    }

    return html`
      <uprtcl-button skinny @click=${() => this.logoutAll()}>logout</uprtcl-button>
      ${this.evees.remotes.map((remote: RemoteWithUI) => {
        return remote.lense !== undefined
          ? remote.lense().render({ remoteId: remote.id })
          : html`
              <evees-author
                user-id=${remote.userId as string}
                remote-id=${remote.id}
              ></evees-author>
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

      evees-author {
        width: 28px;
      }
    `;
  }
}
