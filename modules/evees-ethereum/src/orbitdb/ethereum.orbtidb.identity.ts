import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { IdentitySource } from '@uprtcl/orbitdb-provider';

// TODO: THe identity soruce id must be the same as the remote id, but circular dependency
const evees_if = 'fixed';

export class EthereumOrbitDBIdentity implements IdentitySource {
  constructor(protected connection: EthereumConnection) {}

  get sourceId() {
    return `${this.connection.getNetworkId()}:${evees_if}`;
  }

  get publicKey() {
    return this.connection.getCurrentAccount();
  }

  public async signText(msg: string) {
    await this.connection.connectWallet();
    const signature = await this.connection.signText(msg, this.connection.getCurrentAccount());
    return signature;
  }
}
