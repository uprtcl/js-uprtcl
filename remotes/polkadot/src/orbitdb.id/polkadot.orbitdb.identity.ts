import { IdentitySource } from '@uprtcl/orbitdb-provider';
import { PolkadotConnection } from '../connection.polkadot';

const evees_if = 'fixed';

export class PolkadotOrbitDBIdentity implements IdentitySource {
  constructor(protected connection: PolkadotConnection) {}

  get sourceId() {
    return `${this.connection.getNetworkId()}:${evees_if}`;
  }

  get publicKey() {
    return this.connection.account;
  }

  async signText(msg: string) {
    await this.connection.connectWallet();
    const signature = await this.connection.signText(msg);
    return signature.toString();
  }

  async verify(msg: string, sig: string) {
    return '';
  }
}
