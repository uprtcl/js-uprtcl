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
				apiId: uprtcl_api
			},
			connection
		);
	}

	async getPermissions(hash: string): Promise<BasicAdminPermissions | undefined> {
		return super.getObject<BasicAdminPermissions>(`/permissions/${hash}`);
	}

	async setPermissions(hash: string, permissions: BasicAdminPermissions) {
		return super.put(`/permissions/${hash}`, permissions);
	}

}
