import { BlockchainConnection } from '@uprtcl/evees-blockchain';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PolkadotConnection } from '../../connection.polkadot';

const EVEES_KEYS = ['evees-cid1', 'evees-cid0'];

export class EveesPolkadotConnection implements BlockchainConnection {
  logger: Logger = new Logger('EveesPolkadot');

  constructor(protected connection: PolkadotConnection) {
  }

  async ready() {
    await Promise.all([this.connection.ready()]);
  }

  async updateHead(head: string) {
    await this.connection.updateMutableHead(head, EVEES_KEYS);
  }

  getHead(userId: string, block?: number) {
    return this.connection.getMutableHead(userId, EVEES_KEYS, block);
  }

  get account() {
    return this.connection.account;
  }
  async getNetworkId() {
    return this.connection.getNetworkId();
  }
  async getLatestBlock() {
    return this.connection.getLatestBlock();
  }
  async canSign() {
    return this.connection.canSign();
  }
  async connectWallet() {
    return this.connection.connectWallet();
  }
  async disconnectWallet() {
    return this.connection.disconnectWallet();
  }
}
