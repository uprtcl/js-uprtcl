import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';

import { CacheService } from './services/cache/cache.service';
import { CacheDexie } from './services/cache/cache.dexie';
import { KnownSourcesService } from './services/known-sources/known-sources.service';
import { KnownSourcesDexie } from './services/known-sources/known-sources.dexie';
import { MultiSourceService } from './services/multi/multi-source.service';
import { DiscoveryService } from './services/discovery.service';
import { Source } from './services/sources/source';
import { MultiplatformBindings } from './bindings';


export class DiscoveryModule extends MicroModule {
  static id = Symbol('discovery-module');

  static bindings = MultiplatformBindings;

  dependencies = [CortexModule.id];

  constructor(
    protected cacheService: CacheService = new CacheDexie(),
    protected localKnownSources: KnownSourcesService = new KnownSourcesDexie()
  ) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    await Promise.all([this.cacheService.ready(), this.localKnownSources.ready()]);

    container.bind<MultiSourceService>(DiscoveryModule.bindings.MultiSource).to(MultiSourceService);
    container.bind<CacheService>(DiscoveryModule.bindings.Cache).toConstantValue(this.cacheService);
    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .toConstantValue(this.localKnownSources);
    container.bind<Source>(DiscoveryModule.bindings.DiscoveryService).to(DiscoveryService);
  }
}
