import { Logger } from '@uprtcl/micro-orchestrator';
import { PolkadotConnection } from './connection.polkadot';

const EVEES_KEYS = ['evees-cid1', 'evees-cid0'];

export class EveesPolkadotConnection extends PolkadotConnection implements BlockchainConnection {
  logger: Logger = new Logger('EveesPolkadot');

  updateHead(head: string) {
    return super.updateMutableHead(head, EVEES_KEYS);
  }

  getHead(userId: string, block?: number) {
    return super.getMutableHead(userId, EVEES_KEYS, block);
  }
}
