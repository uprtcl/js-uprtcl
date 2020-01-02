import { interfaces } from 'inversify';
import { ApolloClient, InMemoryCache, ApolloLink } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { GraphQLSchema } from 'graphql';
import { ITypeDefinitions, makeExecutableSchema, IResolvers } from 'graphql-tools';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { baseTypeDefs, baseResolvers } from './base-schema';
import { DiscoveryLink } from '../discovery/discovery-link';
import { contextContainerLink } from './context-link';
import { GraphQlSchemaModule } from './graphql-schema.module';

export class ApolloClientModule extends MicroModule {
  static id = Symbol('apollo-client-module');

  static types = {
    Client: Symbol('apollo-client'),
    RootSchema: Symbol('apollo-root-schema')
  };

  async onLoad(container: interfaces.Container) {
    container
      .bind(ApolloClientModule.types.RootSchema)
      .toDynamicValue((context: interfaces.Context) => {
        const typeDefs: ITypeDefinitions[] = context.container.getAll(
          GraphQlSchemaModule.types.TypeDefs
        );
        const resolvers: IResolvers[] = context.container.getAll(
          GraphQlSchemaModule.types.Resolvers
        );

        return makeExecutableSchema({
          typeDefs: [baseTypeDefs, ...typeDefs],
          resolvers: [baseResolvers, ...resolvers],
          inheritResolversFromInterfaces: true
        });
      });

    const cache = new InMemoryCache();
    //cache.writeData({ data: { sources: {__typename: 'JSON', id: 0, hi: '0hi'} } });

    container
      .bind(ApolloClientModule.types.Client)
      .toDynamicValue((context: interfaces.Context) => {
        const schema: GraphQLSchema = context.container.get(ApolloClientModule.types.RootSchema);

        return new ApolloClient({
          cache,
          connectToDevTools: true,
          link: ApolloLink.from([
            contextContainerLink(context.container),
            new DiscoveryLink(),
            new SchemaLink({ schema, context: { cache, container: context.container } })
          ])
        });
      });
  }
}
