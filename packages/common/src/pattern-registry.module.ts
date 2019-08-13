import { Dictionary } from 'lodash';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternRegistry } from '@uprtcl/core';

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
