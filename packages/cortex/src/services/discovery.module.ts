import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DiscoveryService } from './discovery.service';
import { CacheService } from './cache/cache.service';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { DiscoverableSource } from './sources/discoverable.source';
import { MultiSourceService } from './multi/multi-source.service';
import { CacheDexie } from './cache/cache.dexie';
import { KnownSourcesDexie } from './known-sources/known-sources.dexie';
import { injectable, interfaces, inject } from 'inversify';
import { PatternRecognizer } from '../patterns/recognizer/pattern.recognizer';
import { CortexTypes } from '../types';

export function discoveryModule(
  cacheService: CacheService = new CacheDexie(),
  localKnownSources: KnownSourcesService = new KnownSourcesDexie(),
  discoverableSources: Array<DiscoverableSource> = []
): any {
  @injectable()
  class DiscoveryModule implements MicroModule {
    constructor(
      @inject(CortexTypes.PatternRecognizer) protected patternRecognizer: PatternRecognizer
    ) {}

    async onLoad(
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      const discoveryService = new DiscoveryService(
        cacheService,
        new MultiSourceService(this.patternRecognizer, localKnownSources, discoverableSources)
      );

      bind<DiscoveryService>(CortexTypes.DiscoveryService).toConstantValue(discoveryService);
    }

    async onUnload(): Promise<void> {}
  }
  return DiscoveryModule;
}
