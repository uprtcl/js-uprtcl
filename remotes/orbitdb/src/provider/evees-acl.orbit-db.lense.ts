import { Client, Logger, Perspective, servicesConnect, Signed } from '@uprtcl/evees';
import { LitElement, property, html, css } from 'lit-element';

import { EveesOrbitDB } from './evees.orbit-db';

export class PermissionsOrbitdDb extends servicesConnect(LitElement) {
  logger = new Logger('PermissionsOrbitdDb');

  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  loading = false;

  @property({ attribute: false })
  owner!: string;

  @property({ attribute: false })
  canUpdate!: boolean;

  remote!: EveesOrbitDB;

  async firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;
    this.remote = this.evees.getPerspectiveRemote<EveesOrbitDB>('orbitdb');
    await this.remote.ready();

    this.owner = await this.getOwner(this.uref);
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
