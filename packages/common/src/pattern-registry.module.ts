import { Dictionary } from 'lodash';

import { MicroModule } from '../../micro-orchestrator/src/modules/micro.module';
import PatternRegistry from '../../core/src/patterns/registry/pattern.registry';

export class PatternRegistryModule implements MicroModule {
  patternRegistry!: PatternRegistry;

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    this.patternRegistry = new PatternRegistry();
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [];
  }
  getId(): string {
    return 'pattern-registry';
  }

  public getPatternRegistry(): PatternRegistry {
    return this.patternRegistry;
  }
}
