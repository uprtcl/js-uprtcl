import { EntropyGenerator } from '@uprtcl/orbitdb-provider';
import { PolkadotConnection } from '../connection.polkadot';

const msg = website => `
Please Read!

I authorize this app to update my _Prtcl content in OrbitDB.
`;

export class PolkadotOrbitDBIdentity implements EntropyGenerator {
  constructor(protected connection: PolkadotConnection) {}

  public async get() {
    await this.connection.connectWallet();
    const signature = await this.connection.signText(msg(window.location.origin));
    return signature.toString();
  }
}
