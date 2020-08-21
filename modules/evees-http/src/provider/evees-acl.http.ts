import { html } from 'lit-element';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpProvider, HttpConnection } from '@uprtcl/http-provider';

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

  setCanWrite(hash: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPermissions(
    hash: string
  ): Promise<any | undefined> {
    return super.getObject(`/permissions/${hash}`);
  }

  async setPermissions(hash: string, permissions: any) {
    await super.httpPut(`/permissions/${hash}`, permissions);
  }

  async canWrite(uref: string, userId: string) {
    return ;
  }

  lense(): Lens {
    return {
        name: 'evees-http:access-control',
        type: 'access-control',
        render: (uref: string) => {
          return html`
            <evees-http-permissions uref=${uref}>
            </evees-http-permissions>
          `;
        },
      };
  };
}
