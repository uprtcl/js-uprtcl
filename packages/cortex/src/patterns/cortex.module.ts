import { injectable, interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { Pattern } from './pattern';
import { CortexTypes } from '../types';

@injectable()
export class CortexModule implements MicroModule {
  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    let recognizer: PatternRecognizer | undefined = undefined;
    bind<PatternRecognizer>(CortexTypes.Recognizer).toDynamicValue((ctx: interfaces.Context) => {
      if (recognizer) return recognizer;

      recognizer = new PatternRecognizer();

      const patterns = ctx.container.getAll<Pattern>(CortexTypes.Pattern);
      recognizer.patterns = patterns;

      return recognizer;
    });
  }
}
