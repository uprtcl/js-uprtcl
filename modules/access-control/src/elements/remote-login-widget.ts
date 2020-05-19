import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { AccessControlModule } from '../access-control.module';
import { Authority } from '../types/authority';

export class RemoteLoginWidget extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String })
  authority: string | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  isAuthorized: boolean = false;

  protected remote: Authority | undefined = undefined;

  firstUpdated() {
    this.loadRemote();
  }

  async loadRemote() {
    if (this.authority !== undefined) return;
    const remotes = this.requestAll(AccessControlModule.bindings.Authority) as Authority[];

    this.remote = remotes.find((remote) => remote.authority === this.authority);
    if (this.remote === undefined)
      throw new Error(`remote not found for authority ${this.authority}`);

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
