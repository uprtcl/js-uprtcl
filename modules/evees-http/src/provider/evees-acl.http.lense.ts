import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesBindings, EveesHelpers, EveesRemote } from '@uprtcl/evees';

import { BasicAdminInheritedPermissions, PermissionType } from './types';

export class EveesAccessControlHttpLense extends moduleConnect(LitElement) {
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
  remote!: any;

  userPermissions!: Object[];

  // TODO: remove
  userList: string[] = [
    'google-oauth2|102538849128130956176',
    'google-oauth2|101944349925589295194',
    'google-oauth2|108882209031762642189',
  ];

  setCutomCliekced() {}

  // TODO:

  // private user permissions
  // - change permissions for each user

  // add new user permissions

  // refactor permission methods to be unique

  // remove custom permissions

  // later:
  // search users

  async addRole(e) {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const { canRead } = this.permissions.effectivePermissions;

    const { currentTarget } = e;

    const selectedUserId = currentTarget.value;

    // add user to user permissions list
    // if the selected user is not on the list
    if (
      selectedUserId !== '' &&
      !this.getUserPermissionList().some(
        (userPermissions) => userPermissions.userId === selectedUserId
      )
    ) {
      await this.remote.accessControl.setPrivatePermissions(
        this.entityId,
        PermissionType.Read,
        selectedUserId
      );

      canRead.push(selectedUserId);

      await this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent('permissions-updated', {
          bubbles: true,
          composed: true,
          cancelable: true,
        })
      );
    }

    // Reset select value
    currentTarget.value = '';
  }

  changeRole(e) {
    const selectedUserRole = e.curerntTarget.value;
  }

  getUserList() {
    // TODO: get correct users
    const { canAdmin } = this.permissions.effectivePermissions;
    return this.userList.filter((user) => canAdmin[0] !== user);
  }

  getUserPermissionList() {
    const {
      canAdmin,
      canWrite,
      canRead,
    } = this.permissions.effectivePermissions;
    let userPermissions: any[] = [];

    userPermissions = userPermissions.concat(
      canAdmin
        .filter((_, adminIndex) => adminIndex !== 0)
        .map((admin) => ({ userId: admin, permission: 'Admin' }))
    );

    userPermissions = userPermissions.concat(
      canWrite.map((write) => ({ userId: write, permission: 'Write' }))
    );

    userPermissions = userPermissions.concat(
      canRead.map((read) => ({ userId: read, permission: 'Read' }))
    );

    return userPermissions;
  }

  changeDelegateTo() {}

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

    this.remote = remote as any;

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

    await this.remote.accessControl.setPublicPermissions(
      this.entityId,
      PermissionType.Read,
      newPublicRead
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

    await this.remote.accessControl.setPublicPermissions(
      this.entityId,
      PermissionType.Write,
      newPublicWrite
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
        ${this.canAdmin
          ? html`
              <div class="row">
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
              </div>
              ${this.getUserPermissionList().map(
                (userPermission) => html`
                  <div class="row">
                    <span>${userPermission.userId}</span>

                    <uprtcl-select
                      value=${userPermission.permission}
                      @selected=${this.changeRole}
                    >
                      ${Object.values(PermissionType).map(
                        (permission) => html`
                          <uprtcl-list-item value=${permission}
                            >${permission}</uprtcl-list-item
                          >
                        `
                      )}
                    </uprtcl-select>
                  </div>
                `
              )}
              <div class="row">
                <uprtcl-select
                  label="Add user permissions"
                  @selected=${this.addRole}
                >
                  ${this.getUserList().map(
                    (user) => html`
                      <uprtcl-list-item value=${user}>${user}</uprtcl-list-item>
                    `
                  )}
                </uprtcl-select>
              </div>
            `
          : ''}
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
