import { EthereumConnection } from '@uprtcl/connections';
import {
  OwnerAccessControlService,
  OwnerAccessControl
} from '../../../../access-control/services/owner-access-control.service';
import { GET_PERSP_DETAILS, UPDATE_OWNER, hashCid } from './common';

export class UprtclAccessControlEthereum implements OwnerAccessControlService {
  constructor(protected ethConnection: EthereumConnection) {}

  async changeOwner(hash: string, newOwnerId: string): Promise<void> {
    const perspectiveIdHash = await hashCid(hash);

    await this.ethConnection.call(UPDATE_OWNER, [perspectiveIdHash, newOwnerId]);
  }

  private async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await hashCid(hash);

    const perspective: { owner: string } = await this.ethConnection.call(GET_PERSP_DETAILS, [perspectiveIdHash]);
    return perspective.owner;
  }

  async canRead(hash: string): Promise<boolean> {
    const owner = await this.getOwner(hash);
    return owner != null;
  }

  async canWrite(hash: string): Promise<boolean> {
    const owner = await this.getOwner(hash);
    return owner === this.ethConnection.getCurrentAccount();
  }

  async getAccessControlInformation(hash: string): Promise<OwnerAccessControl | undefined> {
    const owner = await this.getOwner(hash);
    return { owner };
  }
}
