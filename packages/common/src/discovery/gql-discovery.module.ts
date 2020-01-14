import { DiscoveryModule } from '@uprtcl/multiplatform';

import { discoveryTypeDefs } from './discovery-schema';
import { GraphQlSchemaModule } from '../graphql/graphql-schema.module';
import { ApolloClientModule } from '../graphql/apollo-client.module';

export class GqlDiscoveryModule extends DiscoveryModule {
  dependencies = [ApolloClientModule.id];
  submodules = [new GraphQlSchemaModule(discoveryTypeDefs, {})];
}
