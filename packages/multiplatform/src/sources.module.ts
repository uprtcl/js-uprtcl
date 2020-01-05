import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DiscoveryModule } from './discovery.module';
import { SourceProvider, Source } from './services/sources/source';
import { Ready } from './services/sources/service.provider';

/**
 * This module registers the given sources and makes them available to be used by the `DiscoveryModule`
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
export class SourcesModule extends MicroModule {
  dependencies = [DiscoveryModule.id];

  static types = {
    Source: Symbol('discovery-source')
  };

  constructor(protected sources: Array<{ symbol: symbol; source: SourceProvider }>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    const readyPromises = this.sources.map(symbolSource => {
      const services: Ready[] = [symbolSource.source];

      if (symbolSource.source.knownSources) {
        services.push(symbolSource.source.knownSources);
      }

      return Promise.all(services.map(s => s.ready()));
    });

    await Promise.all(readyPromises);

    // Initialize all the sources
    for (const symbolSource of this.sources) {
      const source = symbolSource.source;

      container.bind<Source>(SourcesModule.types.Source).toConstantValue(source);
      container.bind<Source>(symbolSource.symbol).toConstantValue(source);
      container.bind<Source>(source.uprtclProviderLocator).toConstantValue(source);
    }
  }
}
