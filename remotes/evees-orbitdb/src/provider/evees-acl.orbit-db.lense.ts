import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Signed, Entity } from '@uprtcl/cortex';
import {
  EveesModule,
  EveesHelpers,
  EveesRemote,
  Perspective,
} from '@uprtcl/evees';
import { loadEntity } from '@uprtcl/multiplatform';

import { EveesOrbitDB } from './evees.orbit-db';

export class PermissionsOrbitdDb extends moduleConnect(LitElement) {
  logger = new Logger('PermissionsOrbitdDb');

  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = false;

  @property({ attribute: false })
  owner!: string;

  @property({ attribute: false })
  canWrite!: boolean;

  client!: ApolloClient<any>;
  remote!: EveesOrbitDB;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loading = true;
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.uref
    );
    if (remoteId === undefined) throw new Error('remote not found');

    if (!this.isConnected) return;
    this.remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[]).find((r) => r.id === remoteId) as EveesOrbitDB;
    await this.remote.ready();

    this.owner = await this.getOwner(this.uref);
    this.canWrite = await EveesHelpers.canWrite(this.client, this.uref);

    this.loading = false;
  }

  async getOwner(perspectiveId: string): Promise<string> {
    const singedPerspective = (await loadEntity(
      this.client,
      perspectiveId
    )) as Entity<Signed<Perspective>>;
    return singedPerspective.object.payload.creatorId;
  }

  renderOwner() {
    if (!this.remote) return html``;
    return html`
      <evees-author
        user-id=${this.owner}
        remote-id=${this.remote.id}
        show-name
      ></evees-author>
    `;
  }

  render() {
    return html`
      ${
        this.loading
          ? html` <uprtcl-loading></uprtcl-loading> `
          : html`
              <div class="row title">
                <strong>${this.t('access-control:owner')}:</strong>
                ${this.renderOwner()}
                ${this.canWrite ? html` <b>(you)</b> ` : ''}
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
