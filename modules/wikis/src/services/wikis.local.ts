import { inject, injectable } from 'inversify';

import { Hashed, Hashable } from '@uprtcl/cortex';
import { CacheService, DiscoveryModule } from '@uprtcl/multiplatform';
import { CorePatterns } from '@uprtcl/common';

import { WikisProvider } from './wikis.provider';
import { Wiki } from '../types';

@injectable()
export class WikisLocal implements WikisProvider {
  constructor(
    @inject(CorePatterns.Hashed)
    protected hashedPattern: Hashable<any>,
    @inject(DiscoveryModule.types.Cache)
    protected objectsCache: CacheService
  ) {}

  async createWiki(node: Wiki): Promise<string> {
    const hashed = await this.hashedPattern.derive()(node);

    await this.objectsCache.cache(hashed.id, hashed);

    return hashed.id;
  }

  async ready(): Promise<void> {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get<T>(hash);
  }
}
