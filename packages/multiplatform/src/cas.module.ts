import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DiscoveryModule } from './discovery.module';
import { CASSource } from './types/cas-source';
import { Ready } from './types/ready';
import { CASBindings } from './bindings';
import { CASStore } from './types/cas-store';

/**
 * This module registers the given sources and makes them available to be used by the `DiscoveryModule`
 *
 * Example usage:
 *
 * ```ts
 * class EveesModule extends MicroModule {
 *
 *   ...
 *
 *   submodules = [new CASModule([source1, source2])];
 * }
 * ```
 */
export class CASModule extends MicroModule {
  dependencies = [DiscoveryModule.id];

  static bindings = CASBindings;

  constructor(protected casSources: Array<CASSource>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    const readyPromises = this.casSources.map(source => {
      const services: Ready[] = [source];

      if (source.knownSources) {
        services.push(source.knownSources);
      }

      return Promise.all(services.map(s => s.ready()));
    });

    await Promise.all(readyPromises);

    // Initialize all the sources
    for (const source of this.casSources) {
      container.bind<CASSource>(CASBindings.CASSource).toConstantValue(source);
      container.bind<CASSource>(source.source).toConstantValue(source);

      if ((source as CASStore).put) {
        container.bind<CASStore>(CASBindings.CASStore).toConstantValue((source as CASStore));
      }
    }
  }
}
