import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Remote } from '../types/remote';
import { AccessControlBindings } from '../bindings';

export class RemoteLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String })
  remoteId: string | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  isAuthorized: boolean = false;

  protected remote: Remote | undefined = undefined;

  firstUpdated() {
    this.loadRemote();
  }

  async loadRemote() {
    if (this.remoteId !== undefined) return;
    const remotes = this.requestAll(AccessControlBindings.Remote) as Remote[];

    this.remote = remotes.find((remote) => remote.id === this.remoteId);
    if (this.remote === undefined)
      throw new Error(`remote not found for remoteId ${this.remoteId}`);

    this.isAuthorized = this.remote.userId !== undefined;
  }

  updated(changedProperties) {
    if (changedProperties.has('authority')) {
      this.loadRemote();
    }
  }

  async loginClicked() {
    if (this.remote === undefined) throw Error('this.remoge undefined');

    if (!this.isAuthorized) {
      await this.remote.login();
    } else {
      await this.remote.logout();
    }

    this.loadRemote();
  }

  render() {
    return html`
      <div class="widget-container" @click=${this.loginClicked}>
        ${this.isAuthorized ? 'logout' : 'login'}
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        .widget-container {
          width: 5px;
          height: 50px;
          background-color: red;
        }
      `,
    ];
  }
}
