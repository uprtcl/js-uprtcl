import { HttpProvider, HttpConnection } from '@uprtcl/http-provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { BasicAdminAccessControlService, BasicAdminPermissions } from '@uprtcl/access-control';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class EveesAccessControlHttp extends HttpProvider implements BasicAdminAccessControlService {
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

  async getPermissions(hash: string): Promise<BasicAdminPermissions | undefined> {
    return super.getObject<BasicAdminPermissions>(`/permissions/${hash}`);
  }

  async setPermissions(hash: string, permissions: BasicAdminPermissions) {
    await super.httpPut(`/permissions/${hash}`, permissions);
  }
}
