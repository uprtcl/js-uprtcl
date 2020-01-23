import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule, GraphQlSchemaModule } from '@uprtcl/graphql';

import { DiscoveryService } from './services/discovery.service';
import { MultiplatformBindings } from './bindings';
import { KnownSourcesService } from './services/known-sources.service';
import { KnownSourcesApollo } from './graphql/known-sources.apollo';
import { discoveryTypeDefs } from './graphql/discovery-schema';
import { DiscoverDirective } from './graphql/discover-directive';
import { SourceDirective } from './graphql/source-directive';
import { Source } from './types/source';

export class DiscoveryModule extends MicroModule {
  static id = Symbol('discovery-module');

  static bindings = MultiplatformBindings;

  constructor(protected defaultSourceResolver: (sources: Source[]) => Source) {
    super();
  }

  dependencies = [CortexModule.id, ApolloClientModule.id];
  submodules = [
    new GraphQlSchemaModule(discoveryTypeDefs, {}, [DiscoverDirective, SourceDirective])
  ];

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<DiscoveryService>(DiscoveryModule.bindings.DiscoveryService)
      .to(DiscoveryService);

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSourcesApollo);
  }
}
