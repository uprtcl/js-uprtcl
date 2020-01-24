import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { PatternsModule } from './patterns.module';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { Pattern } from './pattern';
import { CortexBindings } from './bindings';
import { cortexSchema } from './graphql/schema';
import { cortexResolvers } from './graphql/resolvers';

export class CortexModule extends MicroModule {
  static id = Symbol('cortex-module');

  static bindings = CortexBindings;

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

  submodules = [new GraphQlSchemaModule(cortexSchema, cortexResolvers)];
}
