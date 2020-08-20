import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesBindings, EveesHelpers, EveesRemote } from '@uprtcl/evees';

import { EveesHttp } from '@uprtcl/evees-http';

import { PermissionsElement } from './permissions-element';
import {
  BasicAdminPermissions,
  BasicAdminInheritedPermissions,
} from '../services/basic-admin-control.service';

export class PermissionsAdminInherited extends moduleConnect(LitElement)
  implements PermissionsElement<BasicAdminInheritedPermissions> {
  @property()
  entityId!: string;

  @property({ type: Object, attribute: false })
  permissions!: BasicAdminInheritedPermissions;

  @property({ type: Boolean, attribute: false })
  canWrite!: boolean;

  @property({ type: Boolean, attribute: false })
  canRead!: boolean;

  @property({ type: Boolean, attribute: false })
  canAdmin!: boolean;

  client!: ApolloClient<any>;
  remote!: EveesHttp;

  setCutomCliekced() {}

  // TODO:

  // public permission ilst
  // - toggle public (read/write)

  // private user permissions
  // - change permissions for each user

  // add new user permissions

  // refactor permission methods to be unique

  // remove custom permissions

  // later:
  // search users

  chagneRole() {}

  addRole() {}

  chagneDelegateTo() {}

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.entityId
    );

    const remote = (this.requestAll(
      EveesBindings.EveesRemote
    ) as EveesRemote[]).find((remote) => remote.id === remoteId);

    if (!remote) throw new Error(`remote not registered ${remoteId}`);

    this.remote = remote as EveesHttp;

    this.loadPermissions();
  }

  async loadPermissions() {
    const result = await this.client.query({
      query: gql`{
        entity(uref: "${this.entityId}") {
          id
          _context {
            patterns {
              accessControl {
                permissions
              }
            }
          }
        }
      }`,
    });

    const newPermissions =
      result.data.entity._context.patterns.accessControl.permissions;

    this.permissions = newPermissions;

    this.canWrite = newPermissions.effectivePermissions.canWrite;
    this.canRead = newPermissions.effectivePermissions.canRead;
    this.canAdmin = newPermissions.effectivePermissions.canAdmin;
  }

  getOwner() {
    return html`<evees-author
      user-id=${this.permissions.effectivePermissions.canAdmin[0]}
    ></evees-author>`;
  }

  // updated(changedProperties) {
  //   if (changedProperties.has('entityId')) {
  //     this.loadPermissions();
  //   }
  // }

  async togglePublicRead() {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const newPublicRead = !this.permissions.effectivePermissions.publicRead;

    const newPermissions: BasicAdminPermissions = Object.assign(
      {},
      this.permissions.effectivePermissions,
      { publicRead: newPublicRead }
    );

    await this.remote.accessControl.setPermissions(
      this.entityId,
      newPermissions
    );

    this.permissions.effectivePermissions.publicRead = newPublicRead;

    await this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  async togglePublicWrite() {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const newPublicWrite = !this.permissions.effectivePermissions.publicWrite;

    const newPermissions: BasicAdminPermissions = Object.assign(
      {},
      this.permissions.effectivePermissions,
      { publicWrite: newPublicWrite }
    );

    await this.remote.accessControl.setPermissions(
      this.entityId,
      newPermissions
    );

    this.permissions.effectivePermissions.publicWrite = newPublicWrite;

    await this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  render() {
    return html`
      <div class="container">
        <div class="row title">
          <strong>${this.t('access-control:owner')}:</strong> ${this.getOwner()}
        </div>
        <div class="row">
          ${this.canAdmin
            ? html`
                <uprtcl-button
                  icon=${this.permissions.effectivePermissions.publicWrite
                    ? 'visibility_off'
                    : 'visibility'}
                  @click=${this.togglePublicWrite}
                >
                  togglePublicWrite
                </uprtcl-button>

                <uprtcl-button
                  icon=${this.permissions.effectivePermissions.publicRead
                    ? 'visibility_off'
                    : 'visibility'}
                  @click=${this.togglePublicRead}
                >
                  ${!this.permissions.effectivePermissions.publicRead
                    ? this.t('access-control:make-public')
                    : this.t('access-control:make-private')}
                </uprtcl-button>
              `
            : ''}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      uprtcl-button {
        width: 220px;
      }

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
