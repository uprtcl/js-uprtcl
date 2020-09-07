import { ApiPromise, WsProvider } from '@polkadot/api';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

export interface UserPerspectives {
  [perspectiveId: string]: {
    headId?: string;
    context?: string;
  };
}

export class PolkadotConnection extends Connection {
  public api: ApiPromise;

  get account() {
    return '';
  }

  logger = new Logger('Polkadot-Connection');

  constructor(protected ws: string, protected apiOptions?: any, options?: ConnectionOptions) {
    super(options);
  }

  public async connect(): Promise<void> {
    this.logger.log('Connecting');

    const wsProvider = new WsProvider(this.ws);
    this.api = await ApiPromise.create({ provider: wsProvider });

    this.logger.log('Connected', {
      api: this.api
    });
  }

  public getNetworkId() {
    return 'kusama';
  }

  public async canSign(): Promise<boolean> {
    return true;
  }

  public async connectWallet(): Promise<void> {
    return;
  }

  public async getUserPerspectivesHash(userId: string) {
    // read evees entry
    return '';
  }

  public async updateUserPerspectivesHash(userPerspectivesHash: string) {
    // update evees entry
  }
}
