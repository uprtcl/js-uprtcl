import { LitElement, property, html, css } from 'lit-element';

import { Logger } from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin.js';
import { RemoteWithUI } from '../interfaces/remote.with-ui.js';

export class EveesAuthor extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-AUTHOR');

  @property({ type: String, attribute: 'user-id' })
  userId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ type: Boolean, attribute: 'show-name' })
  showName = false;

  @property({ type: Boolean, attribute: 'show-copy' })
  showCopy = false;

  @property({ type: Boolean })
  short = false;

  @property({ attribute: false })
  loading = true;

  protected remote!: RemoteWithUI;

  async firstUpdated() {
    if (!this.isConnected) return;
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('userId') || changedProperties.has('remoteId')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    if (!this.userId) return;

    this.remote = this.evees.getRemote(this.remoteId);
    this.loading = false;
    this.requestUpdate();
  }

  render() {
    if (this.loading) {
      return '';
    }
    return html`<div class="avatar">
        ${this.remote.avatar ? this.remote.avatar(this.userId, { showName: this.showName }) : ''}
      </div>
      ${this.showCopy
        ? html`<uprtcl-copy-to-clipboard text=${this.userId}></uprtcl-copy-to-clipboard>`
        : ''} `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex: 1 1 0px;
        overflow: hidden;
      }
      .avatar {
        flex: 1 1 auto;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    `;
  }
}
