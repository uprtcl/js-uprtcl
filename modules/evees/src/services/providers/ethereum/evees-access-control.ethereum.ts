import { EthereumContract } from '@uprtcl/ethereum-provider';
import { OwnerAccessControlService, OwnerPermissions } from '@uprtcl/access-control';

import { UPDATE_OWNER, GET_PERSP_HASH, GET_PERSP_OWNER } from './common';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(protected uprtclRoot: EthereumContract) {}
  
  async changeOwner(hash: string, newOwnerId: string): Promise<void> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [hash]);

    await this.uprtclRoot.send(UPDATE_OWNER, [perspectiveIdHash, newOwnerId]);
  }

  async setCanWrite(hash: string, userId: string): Promise<void> {
    return this.changeOwner(hash, userId);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [hash]);

    const owner = await this.uprtclRoot.call(GET_PERSP_OWNER, [perspectiveIdHash]);
    return owner.toLowerCase();
  }

  async getPermissions(hash: string): Promise<OwnerPermissions | undefined> {
    let owner = await this.getOwner(hash);
    return { owner };
  }

  setPermissions(hash: string, newPersmissions: OwnerPermissions): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
