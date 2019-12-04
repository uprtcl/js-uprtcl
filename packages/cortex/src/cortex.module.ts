import { interfaces, injectable, inject } from 'inversify';

import {
  MicroModule,
  Logger,
  MicroOrchestratorTypes,
  ModuleProvider
} from '@uprtcl/micro-orchestrator';

import { Pattern } from './patterns/pattern';
import { DiscoveryTypes, PatternTypes, LensesTypes } from './types';
import { ServiceProvider, Ready } from './services/sources/service.provider';
import { Source, SourceProvider } from './services/sources/source';

/**
 * This is a convenience MicroModule class that is supposed to be overriden. It expects a set of patterns, services, sources and elements
 * and registers appropriately so that they are ready and available to be used.
 *
 * Example usage:
 *
 * ```ts
 * @injectable()
 * class EveesModule extends ReduxCortexModule {
 *   get elements() {
 *     return [{ name: 'commit-history', element: CommitHistory }];
 *   }
 *
 *   get sources() {
 *     return eveesProviders.map(evees => ({
 *       symbol: EveesTypes.EveesRemote,
 *       source: evees
 *     }));
 *   }
 *
 *   get services() {
 *     return [
 *       { symbol: EveesTypes.EveesLocal, service: localEvees },
 *       { symbol: EveesTypes.Evees, service: Evees }
 *     ];
 *   }
 *
 *   get patterns() {
 *     return [
 *       { symbol: PatternTypes.Core.Hashed, pattern: CidHashedPattern },
 *       { symbol: PatternTypes.Core.Signed, pattern: DefaultSignedPattern },
 *       { symbol: PatternTypes.Core.Secured, pattern: DefaultSecuredPattern },
 *       { symbol: EveesTypes.PerspectivePattern, pattern: PerspectivePattern },
 *       { symbol: EveesTypes.CommitPattern, pattern: CommitPattern },
 *       { symbol: EveesTypes.ContextPattern, pattern: ContextPattern }
 *     ];
 *   }
 *
 *   submodules = [EveesReduxModule];
 * }
 * ```
 */
@injectable()
export class CortexModule implements MicroModule {
  logger: Logger = new Logger('CortexModule');

  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  get services(): Array<{ symbol: symbol; service: new (...args: any[]) => any }> | undefined {
    return undefined;
  }

  get sources(): Array<{ symbol: symbol; source: SourceProvider }> | undefined {
    return undefined;
  }

  get patterns(): Array<{ symbol: symbol; pattern: new (...args: any[]) => Pattern }> | undefined {
    return undefined;
  }

  get elements():
    | Array<{ name: string; element: Function; options?: ElementDefinitionOptions }>
    | undefined {
    return undefined;
  }

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(DiscoveryTypes.Module);
    await this.moduleProvider(PatternTypes.Module);
    await this.moduleProvider(LensesTypes.Module);

    if (this.sources) {
      const readyPromises = this.sources.map(symbolSource => {
        const services: Ready[] = [symbolSource.source];

        if (symbolSource.source.knownSources) {
          services.push(symbolSource.source.knownSources);
        }

        return Promise.all(services.map(s => s.ready()));
      });

      await Promise.all(readyPromises);
    }

    // Initialize all the sources
    if (this.sources) {
      for (const symbolSource of this.sources) {
        const source = symbolSource.source;

        bind<Source>(DiscoveryTypes.Source).toConstantValue(source);
        bind<Source>(symbolSource.symbol).toConstantValue(source);
        bind<Source>(source.uprtclProviderLocator).toConstantValue(source);
      }
    }

    // Initialize all local
    if (this.services) {
      for (const service of this.services) {
        bind<typeof service>(service.symbol).to(service.service);
      }
    }

    // Initialize all the patterns
    if (this.patterns) {
      for (const symbolPattern of this.patterns) {
        const pattern = symbolPattern.pattern;
        bind<Pattern>(PatternTypes.Pattern).to(pattern);
        bind(symbolPattern.symbol).to(pattern);
      }
    }

    // Initialize all the elements, including lenses
    if (this.elements) {
      for (const element of this.elements) {
        customElements.define(element.name, element.element, element.options);
      }
    }

    this.logger.info(
      `Cortex module successfully initialized, with patterns:`,
      this.patterns,
      'elements:',
      this.elements,
      'sources:',
      this.sources
    );
  }
}
