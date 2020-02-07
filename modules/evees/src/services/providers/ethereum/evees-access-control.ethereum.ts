import { EthereumProvider } from '@uprtcl/ethereum-provider';
import { OwnerAccessControlService, OwnerPermissions } from '@uprtcl/access-control';

import { GET_PERSP_DETAILS, UPDATE_OWNER, hashCid } from './common';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(protected ethProvider: EthereumProvider) {}

  async changeOwner(hash: string, newOwnerId: string): Promise<void> {
    const perspectiveIdHash = await hashCid(hash);

    await this.ethProvider.send(UPDATE_OWNER, [perspectiveIdHash, newOwnerId]);
  }

  async setCanWrite(hash: string, userId: string): Promise<void> {
    return this.changeOwner(hash, userId);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await hashCid(hash);

    const perspective: { owner: string } = await this.ethProvider.call(GET_PERSP_DETAILS, [
      perspectiveIdHash
    ]);
    return perspective.owner.toLowerCase();
  }

  async getPermissions(hash: string): Promise<OwnerPermissions | undefined> {
    let owner = await this.getOwner(hash);
    return { owner };
  }
}
