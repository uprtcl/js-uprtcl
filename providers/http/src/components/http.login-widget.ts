import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from "@uprtcl/micro-orchestrator";
import { HttpEthAuthProvider } from '../http-eth-auth.provider';
import { HttpEthAuthProviderBindings } from '../bindings';
import { HttpProvider } from 'src/http.provider';

export class HttpRemoteLoginWidget extends moduleConnect(LitElement) {

  logger = new Logger('EVEES-INFO');

  @property({ type: String })
  authority: string | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  isAuthorized: boolean = false;

  protected eveesHttpProvider: HttpEthAuthProvider | undefined = undefined;

  firstUpdated() {
    this.loadServices()
  }

  loadServices() {
    if (this.authority !== undefined) return;
    this.eveesHttpProvider = this.request(HttpEthAuthProviderBindings.httpEthAuthProvider);
    
    if (this.eveesHttpProvider === undefined) throw Error('this.eveesHttpProvider undefined');
    this.isAuthorized = this.eveesHttpProvider.isAuthorized();
  }

  updated(changedProperties) {
    if (changedProperties.has('authority')) {
      this.loadServices();
    }
  }

  async loginClicked() {
    if (this.eveesHttpProvider === undefined) throw Error('this.eveesHttpProvider undefined');

    if (!this.isAuthorized) {
      await this.eveesHttpProvider.login();
    } else {
      await this.eveesHttpProvider.logout();
    }

    this.loadServices();
  }

  render() {
    return html`
      <div class="widget-container" @click=${this.loginClicked}>${ this.isAuthorized ? 'logout' : 'login'}</div>
    `;
  }

  static get styles() {
    return [css`
      .widget-container {
        width: 5px;
        height: 50px;
        background-color: red;
      }
    `];
  }

}
