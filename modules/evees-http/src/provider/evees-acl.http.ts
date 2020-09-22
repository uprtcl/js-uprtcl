import { html } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';
import { HttpProvider } from '@uprtcl/http-provider';
import { PermissionType, UserPermissions } from './types';

const uprtcl_api: string = 'uprtcl-acl-v1';
export class EveesAccessControlHttp implements AccessControlService {
  logger = new Logger('HTTP-EVEES-ACCESS-CONTROL');

  constructor(protected provider: HttpProvider) {}

  async toggleDelegate(hash: string, delegate: boolean, delegateTo: string) {
    await this.provider.put(
      `/permissions/${hash}/delegate?delegate=${delegate}&delegateTo=${delegateTo}`,
      {}
    );
  }

  async getUserPermissions(hash: string) {
    return await this.provider.getObject<UserPermissions>(`/permissions/${hash}/can`);
  }

  async getPermissions(hash: string): Promise<any | undefined> {
    return this.provider.getObject(`/permissions/${hash}`);
  }

  async setPermissions(hash: string, permissions: any) {
    await this.provider.put(`/permissions/${hash}`, permissions);
  }

  async removePermissions(hash: string, userId: string) {
    await this.provider.delete(`/permissions/${hash}/single/${userId}`);
  }

  async setPrivatePermissions(
    hash: string,
    type: PermissionType,
    userId: string
  ) {
    await this.provider.put(`/permissions/${hash}/single`, {
      type,
      userId,
    });
  }

  async setPublicPermissions(
    hash: string,
    type: PermissionType,
    value: Boolean
  ) {
    await this.provider.put(`/permissions/${hash}/public`, { type, value });
  }

  async canWrite(uref: string) {
    const res = await this.getUserPermissions(uref);
    return res.canWrite;
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html`
          <evees-http-permissions
            uref=${entity.uref}
            parentId=${entity.parentId}
          > </evees-http-permissions>
        `;
      },
    };
  }
}
