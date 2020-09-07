import { ApiPromise, WsProvider } from '@polkadot/api';

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

export class PolkadotConnection extends Connection {
  public api: ApiPromise;

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
}
