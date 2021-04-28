import { Logger } from '../../../utils/logger';
import { Client } from '../../interfaces/client';

import { ClientCachedBase } from '../cached/client.cached.base';
import { CacheOnMemory } from './cache.memory';

export class ClientOnMemory extends ClientCachedBase {
  logger = new Logger('ClientOnMemory');

  constructor(readonly base: Client, readonly name: string = 'OnMemoryClient') {
    super(base, new CacheOnMemory(), name);
  }
}
