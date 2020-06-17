import { AccessControlService } from '@uprtcl/access-control';
import { OrbitDBConnection } from '@uprtcl/orbit-db-provider';
import { getPerspectiveStore } from './common'

interface OrbitDBPermissions {
  canAppend: Boolean;
  write: string[] | undefined;
}

export class EveesAccessControlOrbitDB implements AccessControlService {
  constructor(
    protected orbitdbConnection: OrbitDBConnection,
    protected ipfsDagGet: Function
  ) {}

  async setCanWrite(ref: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPermissions(perspectiveId: string): Promise<OrbitDBPermissions | undefined> {
    const { payload: perspective } = await this.ipfsStoreGet(perspectiveId);
    const { access, identity } = await getPerspectiveStore(this.orbitdbConnection, perspective);
    return {
      canAppend: await access.canAppend({ identity }),
      write: access.write || undefined
    };
  }

  setPermissions(hash: string, newPersmissions: OwnerPermissions): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
