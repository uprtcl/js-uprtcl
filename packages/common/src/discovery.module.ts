import { Dictionary } from 'lodash';

import { MicroModule } from '../../micro-orchestrator/src/modules/micro.module';
import {
  DiscoveryService,
  CacheService,
  MultiSourceService,
  KnownSourcesService,
  DiscoverableSource
} from '../../core/src/services';
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
