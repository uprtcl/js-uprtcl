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
import { PatternTypes, DiscoveryTypes } from '../types';
import { Source } from './sources/source';

export function discoveryModule(
  cacheService: CacheService = new CacheDexie(),
  localKnownSources: KnownSourcesService = new KnownSourcesDexie(),
  discoverableSources: Array<DiscoverableSource> = []
): any {
  @injectable()
  class DiscoveryModule implements MicroModule {
    constructor(
      @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer
    ) {}

    async onLoad(): Promise<void> {
      await Promise.all([cacheService.ready(), localKnownSources.ready()])
    }

    async onInit(
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {

      bind<MultiSourceService>(DiscoveryTypes.LocalMultiSource).to(MultiSourceService);
      bind<CacheService>(DiscoveryTypes.LocalCache).toConstantValue(cacheService);
      bind<KnownSourcesService>(DiscoveryTypes.LocalKnownSources).toConstantValue(
        localKnownSources
      );
      bind<Source>(DiscoveryTypes.Source).to(DiscoveryService);
    }

    async onUnload(): Promise<void> {}
  }
  return DiscoveryModule;
}
