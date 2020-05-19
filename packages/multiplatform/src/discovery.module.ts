import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule, Pattern, PatternsModule } from '@uprtcl/cortex';
import { ApolloClientModule, GraphQlSchemaModule } from '@uprtcl/graphql';

import { MultiSourceService } from './references/known-sources/multi-source.service';
import { DiscoveryBindings } from './bindings';
import { KnownSourcesService } from './references/known-sources/known-sources.service';
import { KnownSourcesApollo } from './graphql/known-sources.apollo';
import { discoveryTypeDefs } from './graphql/schema';
import { DiscoverDirective } from './graphql/directives/discover-directive';
import { CASSourceDirective } from './graphql/directives/cas-source-directive';
import { EntityCache } from './graphql/entity-cache';
import { resolvers } from './graphql/resolvers';
import {
  KnownSourcesRefPattern,
  KnownSourcesResolver,
} from './references/known-sources/reference.pattern';

export class DiscoveryModule extends MicroModule {
  static id = 'discovery-module';

  static bindings = DiscoveryBindings;

  dependencies = [CortexModule.id, ApolloClientModule.id];

  constructor(protected defaultSources: string[] = []) {
    super();
  }

  get submodules() {
    return [
      new GraphQlSchemaModule(discoveryTypeDefs, resolvers, [
        DiscoverDirective,
        CASSourceDirective,
      ]),
      new PatternsModule([new KnownSourcesRefPattern([KnownSourcesResolver])]),
    ];
  }

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<MultiSourceService>(DiscoveryModule.bindings.MultiSourceService)
      .to(MultiSourceService);

    for (const source of this.defaultSources) {
      container.bind<string>(DiscoveryModule.bindings.DefaultSource).toConstantValue(source);
    }

    container
      .bind<KnownSourcesService>(DiscoveryModule.bindings.LocalKnownSources)
      .to(KnownSourcesApollo);
    container
      .bind<EntityCache>(DiscoveryModule.bindings.EntityCache)
      .to(EntityCache)
      .inSingletonScope();
  }
}
