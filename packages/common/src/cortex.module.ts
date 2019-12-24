import { injectable, interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { Pattern, PatternRecognizer, CortexTypes } from '@uprtcl/cortex';

import { graphQlSchemaModule } from './graphql/graphql-schema.module';
import { cortexSchema, cortexResolvers } from './graphql/cortex/cortex-schema';

@injectable()
export class CortexModule implements MicroModule {
  submodules = [graphQlSchemaModule(cortexSchema, cortexResolvers)];

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
