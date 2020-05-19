import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { CortexModule } from './cortex.module';
import { Pattern } from './types/pattern';
import { Behaviour } from './types/behaviour';

/**
 * This is a convenience MicroModule class that depends on `CortexModule` and registers the given set of patterns
 * to be used by Cortex
 *
 * Example usage:
 *
 * ```ts
 * class EveesModule extends MicroModule {
 *
 *   ...
 *
 *   get submodules() {
 *     return [new PatternsModule([new PerspectivePattern()])];
 *   }
 * }
 * ```
 */
export class PatternsModule extends MicroModule {
  dependencies = [CortexModule.id];

  constructor(protected patterns: Array<Pattern<any>>) {
    super();
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    // Initialize all the patterns
    for (const pattern of this.patterns) {
      const dynamicCreator = (ctx: interfaces.Context) => {
        const behaviours: Array<Behaviour<any>> = pattern.behaviourCreators.map((prop) =>
          ctx.container.resolve(prop)
        );

        return <Pattern<any>>{
          ...pattern,
          recognize: pattern.recognize,
          behaviours,
        };
      };
      container.bind<Pattern<any>>(CortexModule.bindings.Pattern).toDynamicValue(dynamicCreator);

      const type = pattern.type;

      if (type) {
        container.bind<Pattern<any>>(type).toDynamicValue(dynamicCreator);
      }
    }
  }
}
