import { html } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';
import { HttpProvider, HttpConnection } from '@uprtcl/http-provider';
import { PermissionType } from './types';

const uprtcl_api: string = 'uprtcl-acl-v1';
export class EveesAccessControlHttp extends HttpProvider
  implements AccessControlService {
  logger = new Logger('HTTP-EVEES-ACCESS-CONTROL');

  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: uprtcl_api,
      },
      connection
    );
  }

  async getPermissions(hash: string): Promise<any | undefined> {
    return super.getObject(`/permissions/${hash}`);
  }

  async setPermissions(hash: string, permissions: any) {
    await super.httpPut(`/permissions/${hash}`, permissions);
  }

  async setPrivatePermissions(
    hash: string,
    type: PermissionType,
    userId: string
  ) {
    await super.httpPut(`/permissions/${hash}/single`, { type, userId });
  }

  async setPublicPermissions(
    hash: string,
    type: PermissionType,
    value: Boolean
  ) {
    await super.httpPut(`/permissions/${hash}/public`, { type, value });
  }

  async canWrite(uref: string, userId?: string) {
    return true;
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: string) => {
        return html`
          <evees-http-permissions uref=${entity}> </evees-http-permissions>
        `;
      },
    };
  }
}
