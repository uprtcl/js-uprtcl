import {
  MicroModule,
  Logger,
  MicroOrchestratorTypes,
  ModuleProvider
} from '@uprtcl/micro-orchestrator';
import { interfaces, injectable, inject } from 'inversify';

import { Pattern } from './patterns/pattern';
import { DiscoverableSource } from './services/sources/discoverable.source';
import { DiscoveryTypes, PatternTypes, LensesTypes } from './types';
import { NamedSource } from './services/sources/named.source';
import { Ready } from './services/sources/source';

@injectable()
export class CortexModule implements MicroModule {
  @inject(MicroOrchestratorTypes.Logger)
  logger!: Logger;

  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  get services(): Array<{ symbol: symbol; service: new (...args: any[]) => any }> | undefined {
    return undefined;
  }

  get sources(): Array<{ symbol: symbol; source: DiscoverableSource<NamedSource> }> | undefined {
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
      await Promise.all(
        this.sources.map(discoverableSource => {
          const services: Ready[] = [discoverableSource.source.service];

          if (discoverableSource.source.knownSources) {
            services.push(discoverableSource.source.knownSources);
          }

          return Promise.all(services.map(s => s.ready()));
        })
      );
    }

    // Initialize all the sources
    if (this.sources) {
      for (const symbolSource of this.sources) {
        const discoverableSource = symbolSource.source;

        bind<DiscoverableSource<any>>(DiscoveryTypes.DiscoverableSource).toConstantValue(
          discoverableSource
        );
        bind<DiscoverableSource<any>>(symbolSource.symbol).toConstantValue(discoverableSource);
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

  async onUnload(): Promise<void> {}
}
