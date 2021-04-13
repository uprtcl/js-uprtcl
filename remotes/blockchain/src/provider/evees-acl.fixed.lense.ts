import { LitElement, property, html, css } from 'lit-element';

import { Perspective, Logger, Signed } from '@uprtcl/evees';
import { servicesConnect } from '@uprtcl/evees-ui';

import { EveesBlockchain } from './evees.blockchain';

export class PermissionsFixedLense extends servicesConnect(LitElement) {
  logger = new Logger('BLOCKCHAIN-PERMISSIONS-FIXED');

  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  loading = true;

  @property({ attribute: false })
  owner!: string;

  @property({ attribute: false })
  canUpdate!: boolean;

  remote!: EveesBlockchain;

  async firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;
    this.remote = await this.evees.getPerspectiveRemote<EveesBlockchain>(this.uref);
    await this.remote.ready();

    this.owner = await this.getOwner(this.uref);
    this.canUpdate = await this.remote.canUpdate(this.uref);

    this.loading = false;
  }

  async getOwner(perspectiveId: string): Promise<string> {
    const singedPerspective = await this.evees.client.store.getEntity<Signed<Perspective>>(
      perspectiveId
    );
    return singedPerspective.object.payload.creatorId;
  }

  renderOwner() {
    return html`
      <evees-author user-id=${this.owner} remote-id=${this.remote.id} show-name></evees-author>
    `;
  }

  render() {
    return html`
      ${
        this.loading
          ? html` <uprtcl-loading></uprtcl-loading> `
          : html`
              <div class="row title">
                <strong>Owner:</strong>
                ${this.renderOwner()} ${this.canUpdate ? html` <b>(you)</b> ` : ''}
              </div>
            `
      }
            </div>
    `;
  }

  static get styles() {
    return css`
      .title {
        margin-bottom: 32px;
      }
      .row {
        width: 100%;
      }
      evees-author {
        margin: 0 auto;
      }
    `;
  }
}
