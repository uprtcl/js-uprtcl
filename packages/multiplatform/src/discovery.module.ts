import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule, GraphQlSchemaModule } from '@uprtcl/graphql';

import { MultiSourceService } from './known-sources/multi-source.service';
import { MultiplatformBindings } from './bindings';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { KnownSourcesApollo } from './graphql/known-sources.apollo';
import { discoveryTypeDefs } from './graphql/schema';
import { DiscoverDirective } from './graphql/directives/discover-directive';
import { CASSourceDirective } from './graphql/directives/cas-source-directive';
import { EntityCache } from './graphql/entity-cache';

export class DiscoveryModule extends MicroModule {
  static id = 'discovery-module';

  static bindings = MultiplatformBindings;

  dependencies = [CortexModule.id, ApolloClientModule.id];
  submodules = [
    new GraphQlSchemaModule(discoveryTypeDefs, {}, [DiscoverDirective, CASSourceDirective])
  ];

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<MultiSourceService>(DiscoveryModule.bindings.MultiSourceService)
      .to(MultiSourceService);

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSourcesApollo);
    container
      .bind<EntityCache>(DiscoveryModule.bindings.EntityCache)
      .to(EntityCache)
      .inSingletonScope();
  }
}
