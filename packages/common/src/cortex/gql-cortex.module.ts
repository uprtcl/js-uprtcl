import { CortexModule } from '@uprtcl/cortex';

import { cortexSchema, cortexResolvers } from './cortex-schema';
import { GraphQlSchemaModule } from '../graphql/graphql-schema.module';
import { ApolloClientModule } from '../graphql/apollo-client.module';

export class GqlCortexModule extends CortexModule {
  submodules = [new GraphQlSchemaModule(cortexSchema, cortexResolvers)];
  dependencies = [ApolloClientModule.id];
}
