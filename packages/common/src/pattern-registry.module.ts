import { Dictionary } from 'lodash';

import { MicroModule } from '../../micro-orchestrator/dist/micro-orchestrator.es5.js';
import PatternRegistry from '../../core/dist/uprtcl-core.es5.js';

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
