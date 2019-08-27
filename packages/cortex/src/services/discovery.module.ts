import { Dictionary } from 'lodash';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { PatternRegistryModule, PATTERN_REGISTRY_MODULE_ID } from '../patterns/pattern-registry.module';
import { DiscoveryService } from './discovery.service';
import { CacheService } from './cache/cache.service';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { DiscoverableSource } from './sources/discoverable.source';
import { MultiSourceService } from './multi/multi-source.service';

export const DISCOVERY_MODULE_ID = 'discovery-module';

export class DiscoveryModule implements MicroModule {
  discoveryService!: DiscoveryService;

  constructor(
    protected cacheService: CacheService,
    protected localKnownSources: KnownSourcesService,
    protected discoverableSources: Array<DiscoverableSource> = []
  ) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const patternRegistryModule: PatternRegistryModule = dependencies[
      PATTERN_REGISTRY_MODULE_ID
    ] as PatternRegistryModule;

    this.discoveryService = new DiscoveryService(
      this.cacheService,
      new MultiSourceService(
        patternRegistryModule.patternRegistry,
        this.localKnownSources,
        this.discoverableSources
      )
    );
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [PATTERN_REGISTRY_MODULE_ID];
  }
  getId(): string {
    return DISCOVERY_MODULE_ID;
  }
}
