import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule, GraphQlSchemaModule } from '@uprtcl/graphql';

import { DiscoveryService } from './services/discovery.service';
import { MultiplatformBindings } from './bindings';
import { KnownSourcesService } from './services/known-sources.service';
import { KnownSourcesApollo } from './graphql/known-sources.apollo';
import { discoveryTypeDefs } from './graphql/schema';
import { DiscoverDirective } from './graphql/directives/discover-directive';
import { SourceDirective } from './graphql/directives/source-directive';
import { discoverResolvers } from './graphql/resolvers';
import { TaskQueue } from './utils/task.queue';
import { EntityCache } from './graphql/entity-cache';

export class DiscoveryModule extends MicroModule {
  static id = Symbol('discovery-module');

  static bindings = MultiplatformBindings;

  dependencies = [CortexModule.id, ApolloClientModule.id];
  submodules = [
    new GraphQlSchemaModule(discoveryTypeDefs, discoverResolvers, [
      DiscoverDirective,
      SourceDirective
    ])
  ];

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<DiscoveryService>(DiscoveryModule.bindings.DiscoveryService)
      .to(DiscoveryService);

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSourcesApollo);
    container.bind<TaskQueue>(DiscoveryModule.bindings.TaskQueue).to(TaskQueue);
    container.bind<EntityCache>(DiscoveryModule.bindings.EntityCache).to(EntityCache).inSingletonScope();
  }
}
