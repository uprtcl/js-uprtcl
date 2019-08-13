import { Dictionary } from 'lodash';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import {
  CacheService,
  DiscoveryService,
  MultiSourceService,
  KnownSourcesService,
  DiscoverableSource
} from '@uprtcl/core';
import { PatternRegistryModule } from './pattern-registry.module';

export const DISCOVERY_MODULE = 'discovery-module';

export class DiscoveryModule implements MicroModule {
  discoveryService!: DiscoveryService;

  constructor(
    protected cacheService: CacheService,
    protected localKnownSources: KnownSourcesService,
    protected discoverableSources: Array<DiscoverableSource> = []
  ) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const patternRegistryModule: PatternRegistryModule = dependencies[
      'pattern-registry'
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
    return ['pattern-registry'];
  }
  getId(): string {
    return DISCOVERY_MODULE;
  }
}
