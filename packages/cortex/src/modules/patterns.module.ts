import { interfaces, injectable, inject } from 'inversify';

import {
  MicroModule,
  MicroOrchestratorTypes,
  ModuleProvider,
  Constructor,
  Dictionary
} from '@uprtcl/micro-orchestrator';

import { Pattern } from '../patterns/pattern';
import { CortexTypes } from '../types';

/**
 * This is a convenience MicroModule class that is supposed to be overriden. It expects a set of patterns
 * and registers them appropriately so that they are ready and available to be used by the `CortexModule`.
 *
 * Example usage:
 *
 * ```ts
 * @injectable()
 * class EveesModule extends PatternsModule {
 *
 *   get patterns() {
 *     return [
 *       { symbol: CortexTypes.Core.Hashed, pattern: CidHashedPattern },
 *       { symbol: CortexTypes.Core.Signed, pattern: DefaultSignedPattern },
 *       { symbol: CortexTypes.Core.Secured, pattern: DefaultSecuredPattern },
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
export abstract class PatternsModule implements MicroModule {
  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  abstract get patterns(): Dictionary<Array<Constructor<Pattern>>>;

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(CortexTypes.Module);

    // Initialize all the patterns
    const patterns = this.patterns;
    for (const symbol of Object.getOwnPropertySymbols(patterns)) {
      for (const p of patterns[symbol as any]) {
        bind<Pattern>(CortexTypes.Pattern).to(p);
        bind(symbol).to(p);
      }
    }
  }
}

export function patternsModule(
  patterns: Dictionary<Array<Constructor<Pattern>>>
): Constructor<MicroModule> {
  @injectable()
  class PatternsModuleInstance extends PatternsModule {
    get patterns() {
      return patterns;
    }
  }
  return PatternsModuleInstance;
}
