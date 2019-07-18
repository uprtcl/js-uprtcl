import { UprtclProvider } from './uprtcl.provider';
import { CacheService } from '../../discovery/cache/cache.service';
import { CachedProviderService } from '../../discovery/cached-remotes/cached-provider.service';
import { MultiProviderService } from '../../discovery/multi/multi-provider.service';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { Context } from '../types';
import { UprtclMultiProvider } from './uprtcl.multi-provider';
import PatternRegistry from '../../js-uprtcl';

export class UprtclService implements UprtclMultiProvider {
  cachedMultiProvider: CachedProviderService<
    UprtclProvider & CacheService,
    MultiProviderService<UprtclProvider>
  >;

  constructor(
    patternRegistry: PatternRegistry,
    cache: UprtclProvider & CacheService,
    multiProvider: MultiProviderService<UprtclProvider>
  ) {
    this.cachedMultiProvider = new CachedProviderService<
      UprtclProvider & CacheService,
      MultiProviderService<UprtclProvider>
    >(patternRegistry, cache, multiProvider);
  }

  createContextIn(source: string, context: Context): Promise<Secured<Context>> {
    return this.cachedMultiProvider.optimisticCreate(context);
  }
}
