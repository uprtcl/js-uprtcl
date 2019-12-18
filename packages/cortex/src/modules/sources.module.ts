import { interfaces, injectable, inject } from 'inversify';

import {
  MicroModule,
  Logger,
  MicroOrchestratorTypes,
  ModuleProvider,
  Constructor
} from '@uprtcl/micro-orchestrator';

import { Pattern } from '../patterns/pattern';
import { DiscoveryTypes, CortexTypes, LensesTypes } from '../types';
import { ServiceProvider, Ready } from '../services/sources/service.provider';
import { Source, SourceProvider } from '../services/sources/source';

/**
 * This is a convenience MicroModule class that is supposed to be overriden. It expects a set of sources
 * and registers them appropriately so that they are ready and available to be used by the `DiscoveryModule`.
 *
 * Example usage:
 *
 * ```ts
 * @injectable()
 * class EveesModule extends SourcesModule {
 *
 *   get sources() {
 *     return eveesProviders.map(evees => ({
 *       symbol: EveesTypes.EveesRemote,
 *       source: evees
 *     }));
 *   }
 *
 * }
 * ```
 */
@injectable()
export abstract class SourcesModule implements MicroModule {
  logger: Logger = new Logger('CortexModule');

  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  abstract get sources(): Array<{ symbol: symbol; source: SourceProvider }>;

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(DiscoveryTypes.Module);

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

      bind<Source>(DiscoveryTypes.Source).toConstantValue(source);
      bind<Source>(symbolSource.symbol).toConstantValue(source);
      bind<Source>(source.uprtclProviderLocator).toConstantValue(source);
    }
  }
}

export function sourcesModule(
  sources: Array<{ symbol: symbol; source: SourceProvider }>
): Constructor<MicroModule> {
  @injectable()
  class SourcesModuleInstance extends SourcesModule {
    get sources() {
      return sources;
    }
  }
  return SourcesModuleInstance;
}
