import { html } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';
import { HttpProvider } from '@uprtcl/http-provider';
import { PermissionType, UserPermissions } from './types';
import { EveesHttpCacheDB } from './evees.http.cache.db';

const uprtcl_api: string = 'uprtcl-acl-v1';
export class EveesAccessControlHttp implements AccessControlService {
  logger = new Logger('HTTP-EVEES-ACCESS-CONTROL');

  constructor(
    protected provider: HttpProvider,
    protected cache: EveesHttpCacheDB
  ) {}

  async toggleDelegate(hash: string, delegate: boolean, delegateTo: string) {
    await this.provider.put(
      `/permissions/${hash}/delegate?delegate=${delegate}&delegateTo=${delegateTo}`,
      {}
    );
  }

  async getUserPermissions(hash: string): Promise<UserPermissions> {
    const cachedNew = await this.cache.newPerspectives.get(hash);
    if (cachedNew !== undefined) {
      return {
        canAdmin: true,
        canRead: true,
        canWrite: true,
      };
    }
    return await this.provider.getObject<UserPermissions>(
      `/permissions/${hash}`
    );
  }

  async getPermissions(hash: string): Promise<any | undefined> {
    const cachedNew = await this.cache.newPerspectives.get(hash);
    if (cachedNew !== undefined) {
      return undefined;
    }

    return this.provider.getObject(`/permissions/${hash}/details`);
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
    const cachedNew = await this.cache.newPerspectives.get(uref);
    if (cachedNew !== undefined) {
      return true;
    }

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
          >
          </evees-http-permissions>
        `;
      },
    };
  }
}
