import { Dictionary } from 'lodash';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternRegistry } from './registry/pattern.registry';

export const PATTERN_REGISTRY_MODULE_ID = 'pattern-registry-module';

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
    return PATTERN_REGISTRY_MODULE_ID;
  }

  public getPatternRegistry(): PatternRegistry {
    return this.patternRegistry;
  }
}
