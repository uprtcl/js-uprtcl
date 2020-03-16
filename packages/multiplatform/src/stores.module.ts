import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DiscoveryModule } from './discovery.module';
import { Source } from './types/source';
import { Ready } from './types/ready';
import { SourcesBindings } from './bindings';
import { Store } from './types/store';

/**
 * This module registers the given stores and makes them available to be used by the `DiscoveryModule`
 *
 * Example usage:
 *
 * ```ts
 * class EveesModule extends SourcesModule {
 *
 *   ...
 *
 *   submodules = [new SourcesModule([source1, source2])];
 * }
 * ```
 */
export class StoresModule extends MicroModule {
  dependencies = [DiscoveryModule.id];

  static bindings = SourcesBindings;

  constructor(protected stores: Array<{ symbol: symbol; store: Store }>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    const readyPromises = this.stores.map(symbolSource => {
      const source: Source = symbolSource.store;
      const services: Ready[] = [source];

      if (source.knownSources) {
        services.push(source.knownSources);
      }

      return Promise.all(services.map(s => s.ready()));
    });

    await Promise.all(readyPromises);

    // Initialize all the sources
    for (const symbolSource of this.stores) {
      const source = symbolSource.store;

      container.bind<Source>(SourcesBindings.Source).toConstantValue(source);
      container.bind<Source>(symbolSource.symbol).toConstantValue(source);
      container.bind<Source>(source.source).toConstantValue(source);
    }
  }
}
