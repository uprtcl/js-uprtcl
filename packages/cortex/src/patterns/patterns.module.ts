import { injectable, interfaces } from 'inversify';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { CortexTypes, PatternFactory } from '../types';
import { Pattern } from './pattern';

@injectable()
export class PatternsModule implements MicroModule {
  async onLoad(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    let recognizer: PatternRecognizer | undefined = undefined;
    bind<PatternRecognizer>(CortexTypes.PatternRecognizer).toFactory<PatternRecognizer>(
      (ctx: interfaces.Context) => {
        console.log('hi1');
        return () => {
          if (recognizer) return recognizer;

          recognizer = new PatternRecognizer();
          const patterns = ctx.container.getAll<Pattern>(CortexTypes.Pattern);
          console.log('hi2', patterns);
          recognizer.patterns = patterns;

          return recognizer;
        };
      }
    );
  }

  async onUnload(): Promise<void> {}
}
