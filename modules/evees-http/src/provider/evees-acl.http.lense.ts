import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesBindings, EveesHelpers, EveesRemote } from '@uprtcl/evees';

import { BasicAdminInheritedPermissions, PermissionType } from './types';
import { EveesHttp } from './evees.http';

export class EveesAccessControlHttpLense extends moduleConnect(LitElement) {
  @property()
  uref!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  permissions!: BasicAdminInheritedPermissions;

  @property({ attribute: false })
  canWrite!: string[];

  @property({ attribute: false })
  canRead!: string[];

  @property({ attribute: false })
  canAdmin!: string[];

  client!: ApolloClient<any>;
  remote!: EveesHttp;

  userPermissions!: Object[];

  // TODO: remove
  userList: string[] = [
    'google-oauth2|102538849128130956176',
    'google-oauth2|101944349925589295194',
    'google-oauth2|108882209031762642189',
  ];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.uref
    );

    const remote = (this.requestAll(
      EveesBindings.EveesRemote
    ) as EveesRemote[]).find((remote) => remote.id === remoteId);

    if (!remote) throw new Error(`remote not registered ${remoteId}`);

    this.remote = remote as EveesHttp;

    this.loadPermissions();
  }

  // updated(changedProperties) {
  //   if (changedProperties.has('entityId')) {
  //     this.loadPermissions();
  //   }
  // }

  async loadPermissions() {
    this.loading = true;
    this.permissions = await this.remote.accessControl.getPermissions(
      this.uref
    );

    this.canWrite = this.permissions.effectivePermissions.canWrite;
    this.canRead = this.permissions.effectivePermissions.canRead;
    this.canAdmin = this.permissions.effectivePermissions.canAdmin;
    this.loading = false;
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
        .map((admin) => ({ userId: admin, permission: PermissionType.Admin }))
    );

    userPermissions = userPermissions.concat(
      canWrite.map((write) => ({ userId: write, permission: PermissionType.Write }))
    );

    userPermissions = userPermissions.concat(
      canRead.map((read) => ({ userId: read, permission: PermissionType.Read }))
    );

    return userPermissions;
  }


  async toggleDelegate() {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    await this.remote.accessControl.toggleDelegate(
      this.uref,
      !this.permissions.delegate,
      this.permissions.delegate
        ? ''
        : 'zb2wwxENKCBxVfyBxCp5dzCFM9AG4nU48fAFnYasc6HcrKrkP',
    );

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  async togglePublicRead() {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const newPublicRead = !this.permissions.effectivePermissions.publicRead;

    await this.remote.accessControl.setPublicPermissions(
      this.uref,
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
      this.uref,
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

  async addRole(e) {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const selectedUserId = e.detail.key;


    // add user to user permissions list
    // if the selected user is not on the list
    if (
      selectedUserId &&
      !this.getUserPermissionList().some(
        (userPermissions) => userPermissions.userId === selectedUserId
      )
    ) {
      await this.remote.accessControl.setPrivatePermissions(
        this.uref,
        PermissionType.Read,
        selectedUserId
      );

      this.permissions.effectivePermissions.canRead.push(selectedUserId);

      await this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent('permissions-updated', {
          bubbles: true,
          composed: true,
          cancelable: true,
        })
      );
    }

  }

  async changeRole(userId, event) {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const selectedRole = event.detail.key;


    await this.remote.accessControl.setPrivatePermissions(
      this.uref,
      selectedRole,
      userId,
    );

    let {canAdmin, canRead, canWrite} = this.permissions.effectivePermissions;
    
    this.permissions.effectivePermissions.canAdmin = canAdmin.filter(admin => admin !== userId);
    this.permissions.effectivePermissions.canRead = canRead.filter(read => read !== userId);
    this.permissions.effectivePermissions.canWrite = canWrite.filter(write => write !== userId);

    this.permissions.effectivePermissions[`can${selectedRole}`].push(userId)

    await this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  async removeRole(userId) {
    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    await this.remote.accessControl.removePermissions(
      this.uref,
      userId,
    );

    let {canAdmin, canRead, canWrite} = this.permissions.effectivePermissions;
    
    this.permissions.effectivePermissions.canAdmin = canAdmin.filter(admin => admin !== userId);
    this.permissions.effectivePermissions.canRead = canRead.filter(read => read !== userId);
    this.permissions.effectivePermissions.canWrite = canWrite.filter(write => write !== userId);

    await this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  renderOwner() {
    return html`<evees-author
      user-id=${this.permissions.effectivePermissions.canAdmin[0]}
    ></evees-author>`;
  }

  renderUserPermissionList() {

    const permissionListConfig = {};

    Object.values(PermissionType).forEach(permission => {
      permissionListConfig[permission] = {
        disabled: false,
        graphic: '',
        text: permission,
      };
    });

    return html`
      ${this.getUserPermissionList().map(
        (userPermission) => html`
          <div class="row flex-center">
            <evees-author
              user-id=${userPermission.userId}
            ></evees-author>

            <uprtcl-options-menu
              @option-click=${event => this.changeRole(userPermission.userId, event)}
              .config=${permissionListConfig}
            >
              <span class="user-permission" slot="icon">${userPermission.permission}</span>
            </uprtcl-options-menu>

            <uprtcl-button
              icon="clear"
              @click=${() => this.removeRole(userPermission.userId)}
            ></uprtcl-button>
          </div>
        `
      )}
    `
  }

  renderAddUserPermission() {
    const userListConfig = {};

    this.getUserList().forEach(user => {
      userListConfig[user] = {
        disabled: false,
        graphic: '',
        text: user,
      };
    })

    return html`
      <uprtcl-options-menu
        @option-click=${this.addRole}
        .config=${userListConfig}
      >
        <uprtcl-textfield
          slot="icon"
          label="Search users"
        ></uprtcl-textfield>
      </uprtcl-options-menu>
    `
  }

  renderChangeDelegate() {



    return html`
      <uprtcl-toggle
        @click=${this.toggleDelegate}
        .active=${this.permissions.delegate}
      >Delegate</uprtcl-toggle>
      <uprtcl-textfield
        label="delegateTo"
        .value=${this.testDelegateValue}
      ></uprtcl-textfield>
    `
  }

  render() {
    return this.loading
      ? html`<uprtcl-loading></uprtcl-loading>`
      : html`
          <div class="container">
            <div class="row title">
              <strong>${this.t('access-control:owner')}:</strong>
              ${this.renderOwner()}
            </div>
            ${this.canAdmin
              ? html`
                ${this.permissions.delegate
                  ? html`
                    <p>Permissions being delegated from: ${this.permissions.delegateTo}</p>
                    ${this.renderChangeDelegate()}
                  `
                  : html`
                    <div class="row flex-center">
                      <uprtcl-toggle
                        icon=${this.permissions.effectivePermissions.publicWrite
                          ? 'visibility'
                          : 'visibility_off'}
                        .active=${this.permissions.effectivePermissions.publicWrite}
                        @click=${this.togglePublicWrite}
                      >
                      Public write
                      </uprtcl-toggle>

                      <uprtcl-toggle
                        icon=${this.permissions.effectivePermissions.publicRead
                          ? 'visibility'
                          : 'visibility_off'}
                        .active=${this.permissions.effectivePermissions.publicRead}
                        @click=${this.togglePublicRead}
                      >
                      Public read
                      </uprtcl-toggle>
                    </div>

                    <div class="row">
                      ${this.renderUserPermissionList()}
                    </div>

                    <div class="row">
                      ${this.renderAddUserPermission()}
                    </div>

                    <div class="row">
                      ${this.renderChangeDelegate()}
                    </div>
                  `
                }
                  
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

      .flex-center {
        display: flex;
        justify-content: space-evenly;
      }

      .user-permission {
        cursor: pointer; 
      }


      .user-permission:hover {
        color: #e8e8e8;
      }

      evees-author {
        margin: 0 auto;
      }
    `;
  }
}
