import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DiscoveryModule } from './discovery.module';
import { CASSource } from './types/cas-source';
import { Ready } from './types/ready';
import { CASBindings } from './bindings';
import { CASStore } from './types/cas-store';
import { KnownSourcesSource } from './references/known-sources/known-sources.source';

/**
 * This module registers the given CASSources and makes them available to be used by the `DiscoveryModule`
 *
 * Example usage:
 *
 * ```ts
 * class EveesModule extends MicroModule {
 *
 *   ...
 *
 *   get submodules() {
 *     return [new CASModule([source1, source2])];
 *   }
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
    const readyPromises = this.casSources.map((source) => {
      const services: Ready[] = [source];

      if ((source as KnownSourcesSource).knownSources) {
        services.push((source as KnownSourcesSource).knownSources);
      }

      return Promise.all(services.map((s) => s.ready()));
    });

    await Promise.all(readyPromises);

    // Initialize all the sources
    for (const source of this.casSources) {
      container.bind<CASSource>(CASBindings.CASSource).toConstantValue(source);
      container.bind<CASSource>(source.casID).toConstantValue(source);

      if (typeof (source as CASStore).create === 'function') {
        container.bind<CASStore>(CASBindings.CASStore).toConstantValue(source as CASStore);
      }
    }
  }
}
