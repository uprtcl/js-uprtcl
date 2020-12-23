import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesBindings, EveesHelpers, EveesRemote } from '@uprtcl/evees';
import { HasTitle, CortexModule, PatternRecognizer } from '@uprtcl/cortex';

import {
  BasicAdminInheritedPermissions,
  BasicAdminPermissions,
  PermissionType,
  UserPermissions,
} from './types';
import { EveesHttp } from './evees.http';

export class EveesAccessControlHttpLense extends moduleConnect(LitElement) {
  @property()
  uref!: string;

  @property()
  parentId!: string | null;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  permissions: BasicAdminInheritedPermissions | undefined;

  @property({ attribute: false })
  currentUser!: string;

  client!: ApolloClient<any>;
  remote!: EveesHttp;

  delegatedTitle: string = '';

  userPermissions!: Object[];

  protected recognizer!: PatternRecognizer;

  // TODO: remove
  userList: string[] = [
    'google-oauth2|102538849128130956176',
    'google-oauth2|101944349925589295194',
    'google-oauth2|108882209031762642189',
  ];

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(ApolloClientModule.bindings.Client);
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.uref
    );

    if (!this.isConnected) return;
    const remote = (this.requestAll(
      EveesBindings.EveesRemote
    ) as EveesRemote[]).find((remote) => remote.id === remoteId);

    if (!this.isConnected) return;
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    if (!remote) throw new Error(`remote not registered ${remoteId}`);

    this.remote = remote as EveesHttp;

    const isLoggedIn = this.remote.isLogged();

    this.currentUser = isLoggedIn ? (this.remote.userId as string) : '';

    this.loadPermissions();
  }

  async loadPermissions() {
    this.loading = true;

    const userPermissions: UserPermissions = await this.remote.accessControl.getUserPermissions(
      this.uref
    );

    this.permissions = undefined;
    if (userPermissions.canAdmin) {
      this.permissions = await this.remote.accessControl.getPermissions(
        this.uref
      );
    }

    await this.loadDelegatedTitle();

    this.loading = false;
  }

  async loadDelegatedTitle() {
    if (!this.permissions || !this.permissions.delegateTo) return;

    const delegatedUref = this.permissions.delegateTo;

    const data = await EveesHelpers.getPerspectiveData(
      this.client,
      delegatedUref
    );
    const hasTitle: HasTitle = this.recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasTitle).title);

    const title = hasTitle.title(data);

    this.delegatedTitle = title;
  }

  getUserList() {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    // TODO: get correct users
    const { canAdmin } = this.permissions.effectivePermissions;
    return this.userList.filter((user) => canAdmin[0] !== user);
  }

  getUserPermissionList() {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

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
      canWrite.map((write) => ({
        userId: write,
        permission: PermissionType.Write,
      }))
    );

    userPermissions = userPermissions.concat(
      canRead.map((read) => ({ userId: read, permission: PermissionType.Read }))
    );

    return userPermissions;
  }

  getCorrespondingPermissions(): BasicAdminPermissions {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (this.permissions.delegate) {
      return this.permissions.effectivePermissions;
    }

    if (this.permissions.customPermissions) {
      return this.permissions.customPermissions;
    }

    return this.permissions.effectivePermissions;
  }

  async toggleDelegate() {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const parentId = this.parentId as string;

    // If there is parent, change delegate status
    const newDelegate = parentId ? !this.permissions.delegate : false;

    await this.remote.accessControl.toggleDelegate(
      this.uref,
      newDelegate,
      newDelegate ? parentId : ''
    );

    this.loadPermissions();
  }

  async togglePublicRead() {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const newPublicRead = !this.permissions.effectivePermissions.publicRead;

    await this.remote.accessControl.setPublicPermissions(
      this.uref,
      PermissionType.Read,
      newPublicRead
    );

    this.loadPermissions();
  }

  async togglePublicWrite() {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const newPublicWrite = !this.permissions.effectivePermissions.publicWrite;

    await this.remote.accessControl.setPublicPermissions(
      this.uref,
      PermissionType.Write,
      newPublicWrite
    );

    this.loadPermissions();
  }

  async addRole(e) {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

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

      this.loadPermissions();
    }
  }

  async changeRole(userId, role) {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    const selectedRole = role;

    await this.remote.accessControl.setPrivatePermissions(
      this.uref,
      selectedRole,
      userId
    );

    this.loadPermissions();
  }

  async removeRole(userId) {
    if (!this.permissions) {
      throw new Error(`permissions not found`);
    }

    if (!this.remote.accessControl) {
      throw new Error(`remote accessControl not found`);
    }

    await this.remote.accessControl.removePermissions(this.uref, userId);

    this.loadPermissions();
  }

  renderOwner() {
    if (!this.permissions) return;

    return html`
      <evees-author
        show-name
        user-id=${this.permissions.effectivePermissions.canAdmin[0]}
        remote-id=${this.remote.id}
      ></evees-author>
    `;
  }

  renderUserPermissionList() {
    const permissionListConfig = {};

    Object.values(PermissionType).forEach((permission) => {
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
              remote-id=${this.remote.id}
            ></evees-author>

            ${this.permissions && !this.permissions.delegate
              ? html`
                  <uprtcl-options-menu
                    @option-click=${(event) =>
                      this.changeRole(userPermission.userId, event.detail.key)}
                    .config=${permissionListConfig}
                  >
                    <span class="user-permission" slot="icon"
                      >${userPermission.permission}</span
                    >
                  </uprtcl-options-menu>
                `
              : html` <span>${userPermission.permission}</span> `}
            ${this.permissions && !this.permissions.delegate
              ? html`
                  <uprtcl-button
                    icon="clear"
                    @click=${() => this.removeRole(userPermission.userId)}
                  ></uprtcl-button>
                `
              : ''}
          </div>
        `
      )}
    `;
  }

  renderAddUserPermission() {
    const userListConfig = {};

    this.getUserList().forEach((user) => {
      userListConfig[user] = {
        disabled: false,
        graphic: '',
        text: user,
      };
    });

    return html`
      <uprtcl-options-menu
        @option-click=${this.addRole}
        .config=${userListConfig}
      >
        <uprtcl-textfield
          class="user-search"
          slot="icon"
          label="Search users"
        ></uprtcl-textfield>
      </uprtcl-options-menu>
    `;
  }

  renderChangeDelegate() {
    if (!this.permissions) return;
    return html`
      <uprtcl-toggle
        @toggle-click=${this.toggleDelegate}
        .active=${this.permissions.delegate}
        >Delegate</uprtcl-toggle
      >
    `;
  }

  render() {
    return this.loading
      ? html` <uprtcl-loading></uprtcl-loading> `
      : html`
          <div class="container">
            ${this.permissions
              ? html`
                  <div class="row title">
                    <strong>${this.t('access-control:owner')}:</strong>
                    ${this.renderOwner()}
                  </div>

                  ${this.permissions.delegate
                    ? html`
                        <p>
                          Access control delegated to: ${this.delegatedTitle}
                        </p>
                      `
                    : ''}

                  <div class="row flex-center">
                    <uprtcl-toggle
                      icon=${this.getCorrespondingPermissions().publicWrite
                        ? 'visibility'
                        : 'visibility_off'}
                      .active=${this.getCorrespondingPermissions().publicWrite}
                      .disabled=${this.permissions.delegate}
                      @toggle-click=${this.togglePublicWrite}
                    >
                      Public write
                    </uprtcl-toggle>

                    <uprtcl-toggle
                      icon=${this.getCorrespondingPermissions().publicRead
                        ? 'visibility'
                        : 'visibility_off'}
                      .active=${this.getCorrespondingPermissions().publicRead}
                      .disabled=${this.permissions.delegate}
                      @toggle-click=${this.togglePublicRead}
                    >
                      Public read
                    </uprtcl-toggle>

                    ${this.renderChangeDelegate()}
                  </div>

                  <!-- <div class="row">
                    ${this.renderUserPermissionList()}
                  </div> -->

                  <!-- ${!this.permissions.delegate
                    ? html`
                        <div class="row">${this.renderAddUserPermission()}</div>
                      `
                    : ''} -->
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

      .user-search {
        margin: 0 auto;
        display: block;
        margin-top: 20px;
      }
    `;
  }
}
