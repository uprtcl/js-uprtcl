import { interfaces } from 'inversify';

import { MicroModule, Constructor, Dictionary } from '@uprtcl/micro-orchestrator';

import { CortexModule } from './cortex.module';
import { Pattern } from './pattern';

/**
 * This is a convenience MicroModule class that depends on `CortexModule` and registers the given set of patterns
 * to be used by Cortex
 *
 * Example usage:
 *
 * ```ts
 * class EveesModule extends PatternsModule {
 *
 *   ...
 *
 *   submodules = [new PatternsModule({[EveesBindings.PerspectivePattern]: patterns: [PerspectivePattern]})];
 * }
 * ```
 */
export class PatternsModule extends MicroModule {
  dependencies = [CortexModule.id];

  static bindings= {
    Pattern: Symbol('pattern')
  };

  constructor(protected patterns: Dictionary<Array<Constructor<Pattern>>>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    // Initialize all the patterns
    const patterns = this.patterns;
    for (const symbol of Object.getOwnPropertySymbols(patterns)) {
      for (const p of patterns[symbol as any]) {
        container.bind<Pattern>(PatternsModule.bindings.Pattern).to(p);
        container.bind(symbol).to(p);
      }
    }
  }
}
