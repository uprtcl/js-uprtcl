import { injectable, interfaces } from 'inversify';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { CortexTypes } from '../types';

@injectable()
export class PatternsModule implements MicroModule {
  async onLoad(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    bind<PatternRecognizer>(CortexTypes.PatternRecognizer).to(PatternRecognizer);
  }

  async onUnload(): Promise<void> {}
}
