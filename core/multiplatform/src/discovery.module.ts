import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';

import { MultiSourceService } from './references/known-sources/multi-source.service';
import { DiscoveryBindings } from './bindings';
import { KnownSourcesService } from './references/known-sources/known-sources.service';
import {
  KnownSourcesRefPattern,
  KnownSourcesResolver,
} from './references/known-sources/reference.pattern';

export class DiscoveryModule extends MicroModule {
  static id = 'discovery-module';

  static bindings = DiscoveryBindings;

  dependencies = [CortexModule.id];

  constructor(protected defaultSources: string[] = []) {
    super();
  }

  get submodules() {
    return [
      new PatternsModule([new KnownSourcesRefPattern([KnownSourcesResolver])]),
    ];
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<MultiSourceService>(DiscoveryModule.bindings.MultiSourceService)
      .to(MultiSourceService);

    for (const source of this.defaultSources) {
      container
        .bind<string>(DiscoveryModule.bindings.DefaultSource)
        .toConstantValue(source);
    }

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSources);
    container
      .bind<EntityCache>(DiscoveryModule.bindings.EntityCache)
      .to(EntityCache)
      .inSingletonScope();
  }
}
