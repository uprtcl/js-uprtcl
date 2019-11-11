import { EthereumProvider } from '@uprtcl/connections';
import { OwnerAccessControlService, OwnerAccessControl } from '@uprtcl/common';

import { GET_PERSP_DETAILS, UPDATE_OWNER, hashCid } from './common';

export class EveesAccessControlEthereum implements OwnerAccessControlService {
  constructor(protected ethProvider: EthereumProvider) {}

  async changeOwner(hash: string, newOwnerId: string): Promise<void> {
    const perspectiveIdHash = await hashCid(hash);

    await this.ethProvider.call(UPDATE_OWNER, [perspectiveIdHash, newOwnerId]);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await hashCid(hash);

    const perspective: { owner: string } = await this.ethProvider.call(GET_PERSP_DETAILS, [
      perspectiveIdHash
    ]);
    return perspective.owner;
  }

  async getAccessControlInformation(hash: string): Promise<OwnerAccessControl | undefined> {
    const owner = await this.getOwner(hash);
    return { owner };
  }
}
