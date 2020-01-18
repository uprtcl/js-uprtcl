import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';

import { CacheService } from './services/cache/cache.service';
import { CacheDexie } from './services/cache/cache.dexie';
import { KnownSourcesService } from './services/known-sources/known-sources.service';
import { KnownSourcesDexie } from './services/known-sources/known-sources.dexie';
import { DiscoveryService } from './services/discovery.service';
import { MultiplatformBindings } from './bindings';

export class DiscoveryModule extends MicroModule {
  static id = Symbol('discovery-module');

  static bindings = MultiplatformBindings;

  dependencies = [CortexModule.id];

  constructor(protected localKnownSources: KnownSourcesService = new KnownSourcesDexie()) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    await Promise.all([this.localKnownSources.ready()]);

    container
      .bind<DiscoveryService>(DiscoveryModule.bindings.DiscoveryService)
      .to(DiscoveryService);
    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .toConstantValue(this.localKnownSources);
  }
}
