import { MicroModule, MicroOrchestratorTypes, ModuleProvider } from '@uprtcl/micro-orchestrator';

import { DiscoveryService } from './discovery.service';
import { CacheService } from './cache/cache.service';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { MultiSourceService } from './multi/multi-source.service';
import { CacheDexie } from './cache/cache.dexie';
import { KnownSourcesDexie } from './known-sources/known-sources.dexie';
import { injectable, interfaces, inject } from 'inversify';
import { PatternTypes, DiscoveryTypes } from '../types';
import { Source } from './sources/source';

export function discoveryModule(
  cacheService: CacheService = new CacheDexie(),
  localKnownSources: KnownSourcesService = new KnownSourcesDexie()
): any {
  @injectable()
  class DiscoveryModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      await this.moduleProvider(PatternTypes.Module);
      await Promise.all([cacheService.ready(), localKnownSources.ready()]);

      bind<MultiSourceService>(DiscoveryTypes.MultiSource).to(MultiSourceService);
      bind<CacheService>(DiscoveryTypes.Cache).toConstantValue(cacheService);
      bind<KnownSourcesService>(DiscoveryTypes.LocalKnownSources).toConstantValue(
        localKnownSources
      );
      bind<Source>(DiscoveryTypes.DiscoveryService).to(DiscoveryService);
    }
  }
  return DiscoveryModule;
}
