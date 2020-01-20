import { interfaces } from 'inversify';

import { KnownSourcesService, DiscoveryModule } from '@uprtcl/multiplatform';

import { discoveryTypeDefs } from './discovery-schema';
import { GraphQlSchemaModule } from '../graphql/graphql-schema.module';
import { ApolloClientModule } from '../graphql/apollo-client.module';
import { KnownSourcesApollo } from './known-sources.apollo';

export class GqlDiscoveryModule extends DiscoveryModule {
  dependencies = [ApolloClientModule.id];
  submodules = [new GraphQlSchemaModule(discoveryTypeDefs, {})];

  async onLoad(container: interfaces.Container): Promise<void> {
    await super.onLoad(container);

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSourcesApollo);
  }
}
