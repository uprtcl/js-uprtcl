import { BasicAdminAccessControlService } from '@uprtcl/access-control';

export class EveesAccessControlHttp implements BasicAdminAccessControlService {

	async getPermissions(hash: string): Promise<BasicAdminAccessControlService | undefined> {
		return { 
			publicWrite: true,
			publicRead: true,
			canRead: [],
			canWrite: [],
			canAdmin: []
		 };
	}

}
