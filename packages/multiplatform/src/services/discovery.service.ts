import { injectable, inject } from 'inversify';

import {Hashed} from '@uprtcl/cortex'

import { Source } from './sources/source';
import { CachedSourceService } from './cached-remotes/cached-source.service';
import { CacheService } from './cache/cache.service';
import { MultiSourceService } from './multi/multi-source.service';
import { DiscoveryModule } from '../discovery.module';

@injectable()
export class DiscoveryService implements Source {
  cachedRemote: CachedSourceService<CacheService, Source>;

  constructor(
    @inject(DiscoveryModule.types.Cache) protected cache: CacheService,
    @inject(DiscoveryModule.types.MultiSource) protected multiSource: MultiSourceService
  ) {
    this.cachedRemote = new CachedSourceService<CacheService, Source>(cache, multiSource);
  }

  /**
   * Discovers the object from the cache, or its known sources and all the remotes
   *
   * @param hash the hash of the object to get
   * @returns the object if found, otherwise undefined
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.cachedRemote.get(hash);
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    return this.multiSource.ready();
  }
}
