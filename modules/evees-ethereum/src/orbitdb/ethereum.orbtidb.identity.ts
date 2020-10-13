import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { EntropyGenerator } from '@uprtcl/orbitdb-provider';

const msg = website => `
Please Read!

I authorize this app to update my _Prtcl content in OrbitDB.
`;

export class EthereumOrbitDBIdentity implements EntropyGenerator {
  constructor(protected connection: EthereumConnection) {}

  public async get() {
    await this.connection.connectWallet();
    const signature = await this.connection.signText(
      msg(window.location.origin),
      this.connection.getCurrentAccount()
    );
    return signature;
  }
}
