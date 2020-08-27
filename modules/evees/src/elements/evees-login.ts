import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { EveesRemote } from '../services/evees.remote';
import { EveesBindings } from '../bindings';

export class EveesLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-LOGIN');

  @property({ attribute: false })
  logged!: boolean;

  remotes!: EveesRemote[];

  async firstUpdated() {
    this.remotes = this.requestAll(EveesBindings.EveesRemote);
    this.checkLogged();
  }

  async checkLogged() {
    const loggedList = await Promise.all(
      this.remotes.map((remote) => remote.isLogged())
    );
    this.logged = !loggedList.includes(false);
    this.dispatchEvent(new CustomEvent('logged-in'));
  }

  async loginAll() {
    await Promise.all(
      this.remotes.map(async (remote) => {
        const isLogged = await remote.isLogged();
        if (!isLogged) await remote.login();
      })
    );
    this.checkLogged();
  }

  render() {
    if (this.logged) {
      return html` <uprtcl-button>logout</uprtcl-button> `;
    } else {
      return html`
        <uprtcl-button @click=${() => this.loginAll()}>login</uprtcl-button>
      `;
    }
  }

  static get styles() {
    return css``;
  }
}
