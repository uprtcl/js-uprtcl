import { CortexModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule, ApolloClientModule } from '@uprtcl/graphql';

import { cortexSchema, cortexResolvers } from './cortex-schema';

export class GqlCortexModule extends CortexModule {
  submodules = [new GraphQlSchemaModule(cortexSchema, cortexResolvers)];
  dependencies = [ApolloClientModule.id];
}
