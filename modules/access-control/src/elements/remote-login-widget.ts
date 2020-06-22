import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Remote } from '../types/remote';
import { AccessControlBindings } from '../bindings';

export class RemoteLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String })
  remote: string | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  isAuthorized: boolean = false;

  protected remoteInstance: Remote | undefined = undefined;

  firstUpdated() {
    this.loadRemote();
  }

  async loadRemote() {
    if (this.remoteInstance !== undefined) return;
    const remoteInstances = this.requestAll(
      AccessControlBindings.Remote
    ) as Remote[];

    this.remoteInstance = remoteInstances.find(
      (instance) => instance.id === this.remote
    );
    if (this.remoteInstance === undefined)
      throw new Error(`remote not found for remote ${this.remote}`);

    this.isAuthorized = this.remoteInstance.userId !== undefined;
  }

  updated(changedProperties) {
    if (changedProperties.has('remote')) {
      this.loadRemote();
    }
  }

  async loginClicked() {
    if (this.remoteInstance === undefined) throw Error('this.remoge undefined');

    if (!this.isAuthorized) {
      await this.remoteInstance.login();
    } else {
      await this.remoteInstance.logout();
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
