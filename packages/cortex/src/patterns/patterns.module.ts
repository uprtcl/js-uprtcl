import { injectable, interfaces } from 'inversify';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { Pattern } from './pattern';
import { PatternTypes } from '../types';

@injectable()
export class PatternsModule implements MicroModule {
  onInit(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): void {
    let recognizer: PatternRecognizer | undefined = undefined;
    bind<PatternRecognizer>(PatternTypes.Recognizer).toDynamicValue((ctx: interfaces.Context) => {
      if (recognizer) return recognizer;

      recognizer = new PatternRecognizer();

      const patterns = ctx.container.getAll<Pattern>(PatternTypes.Pattern);
      recognizer.patterns = patterns;

      return recognizer;
    });
  }

  async onLoad(): Promise<void> {}
  async onUnload(): Promise<void> {}
}
