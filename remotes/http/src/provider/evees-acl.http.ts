import { html } from 'lit-element';

import { AccessControl, Logger, Lens } from '@uprtcl/evees';
import { HttpConnection } from '@uprtcl/http-provider';

import { PermissionType, UserPermissions } from './types';

const uprtcl_api = 'uprtcl-acl-v1';
export class EveesAccessControlHttp implements AccessControl {
  logger = new Logger('HTTP-EVEES-ACCESS-CONTROL');

  constructor(protected connection: HttpConnection) {}

  async toggleDelegate(hash: string, delegate: boolean, delegateTo?: string) {
    await this.connection.put(
      `/permissions/${hash}/delegate?delegate=${delegate}&delegateTo=${delegateTo}`,
      {}
    );
  }

  async getUserPermissions(hash: string) {
    return await this.connection.get<UserPermissions>(`/permissions/${hash}`);
  }

  async getPermissions(hash: string): Promise<any | undefined> {
    return this.connection.get(`/permissions/${hash}/details`);
  }

  async removePermissions(hash: string, userId: string) {
    await this.connection.delete(`/permissions/${hash}/single/${userId}`);
  }

  async setPrivatePermissions(hash: string, type: PermissionType, userId: string) {
    await this.connection.put(`/permissions/${hash}/single`, {
      type,
      userId,
    });
  }

  async setPublicPermissions(hash: string, type: PermissionType, value: Boolean) {
    await this.connection.put(`/permissions/${hash}/public`, { type, value });
  }

  async canUpdate(uref: string) {
    const res = await this.getUserPermissions(uref);
    return res.canUpdate;
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html`
          <evees-http-permissions uref=${entity.uref} parentId=${entity.parentId}>
          </evees-http-permissions>
        `;
      },
    };
  }
}
