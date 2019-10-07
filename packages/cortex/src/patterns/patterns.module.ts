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
    bind<PatternRecognizer>(CortexTypes.PatternRecognizer).to(PatternRecognizer);

    bind<PatternFactory>(CortexTypes.PatternFactory).toFactory<Pattern[]>(
      (ctx: interfaces.Context) => {
        console.log('hi1');
        return () => {
          const patterns = ctx.container.getAll<Pattern>(CortexTypes.Pattern);
          console.log('hi2', patterns);

          return patterns;
        };
      }
    );
  }

  async onUnload(): Promise<void> {}
}
