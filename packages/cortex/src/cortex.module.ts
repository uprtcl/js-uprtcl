import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { PatternsModule } from './patterns.module';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { Pattern } from './pattern';

export class CortexModule extends MicroModule {
  static id = Symbol('cortex-module');

  static bindings= {
    Recognizer: Symbol('pattern-recognizer')
  };

  async onLoad(container: interfaces.Container): Promise<void> {
    let recognizer: PatternRecognizer | undefined = undefined;
    container
      .bind<PatternRecognizer>(CortexModule.bindings.Recognizer)
      .toDynamicValue((ctx: interfaces.Context) => {
        if (recognizer) return recognizer;

        recognizer = new PatternRecognizer();

        const patterns = ctx.container.getAll<Pattern>(PatternsModule.bindings.Pattern);
        recognizer.patterns = patterns;

        return recognizer;
      });
  }
}
