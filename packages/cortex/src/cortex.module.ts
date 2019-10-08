import { MicroModule, Logger, MicroOrchestratorTypes } from '@uprtcl/micro-orchestrator';
import { interfaces, injectable, inject } from 'inversify';

import { Pattern } from './patterns/pattern';
import { DiscoverableSource } from './services/sources/discoverable.source';
import { DiscoveryTypes, PatternTypes } from './types';

@injectable()
export class CortexModule implements MicroModule {
  @inject(MicroOrchestratorTypes.Logger)
  logger!: Logger;

  get sources(): Array<{ symbol: symbol; source: DiscoverableSource }> | undefined {
    return undefined;
  }

  get patterns(): Array<{ symbol: symbol; pattern: new (...args: any[]) => Pattern }> | undefined {
    return undefined;
  }

  get elements():
    | Array<{ tag: string; element: Function; options?: ElementDefinitionOptions }>
    | undefined {
    return undefined;
  }

  async onLoad(): Promise<void> {
    this.logger.info(`Attempting to load module`);

    if (this.sources) {
      await Promise.all(
        this.sources.map(discoverableSource =>
          Promise.all([
            discoverableSource.source.source.ready(),
            discoverableSource.source.knownSources.ready()
          ])
        )
      );
    }
    this.logger.info(`Module successfully loaded`);
  }

  onInit(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): void {
    this.logger.info(`Attempting to initialize module`);

    // Initialize all the sources
    if (this.sources) {
      for (const symbolSource of this.sources) {
        const discoverableSource = symbolSource.source;
        const source = discoverableSource.source;

        bind<DiscoverableSource>(DiscoveryTypes.DiscoverableSource).toConstantValue(
          discoverableSource
        );
        bind<typeof source>(symbolSource.symbol).toConstantValue(source);
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
        customElements.define(element.tag, element.element, element.options);
      }
    }

    this.logger.info(
      `Module successfully initialized, with patterns:`,
      this.patterns,
      'elements:',
      this.elements,
      'sources:',
      this.sources
    );
  }

  async onUnload(): Promise<void> {}
}
