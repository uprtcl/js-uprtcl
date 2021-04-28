import { Logger } from '../../../utils/logger';

import { Client } from '../../interfaces/client';
import { ClientCachedBase } from '../cached/client.cached.base';
import { CacheLocal } from './cache.local';

const LOGINFO = false;

export class ClientCachedLocal extends ClientCachedBase {
  logger = new Logger('ClientCachedLocal');

  constructor(readonly base: Client, readonly name: string = 'local') {
    super(base, new CacheLocal(`${name}-cache`), `${name}-client`);
  }
}
