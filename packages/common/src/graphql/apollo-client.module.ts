import { interfaces } from 'inversify';
import { ApolloClient, InMemoryCache, ApolloLink, NormalizedCacheObject } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { persistCache } from 'apollo-cache-persist';
import { PersistentStorage, PersistedData } from 'apollo-cache-persist/types';
import { GraphQLSchema } from 'graphql';
import { ITypeDefinitions, makeExecutableSchema, IResolvers } from 'graphql-tools';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { baseTypeDefs } from './base-schema';
import { baseResolvers } from './base-resolvers';
import { GraphQlSchemaBindings, ApolloClientBindings } from './bindings';
import { DiscoverDirective } from '../discovery/discover-directive';

export type ApolloClientBuilder = (finalLink: ApolloLink) => ApolloClient<any>;

export class ApolloClientModule extends MicroModule {
  static id = Symbol('apollo-client-module');

  static bindings = ApolloClientBindings;

  constructor(protected apolloClientBuilder?: ApolloClientBuilder) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container
      .bind(ApolloClientModule.bindings.RootSchema)
      .toDynamicValue((context: interfaces.Context) => {
        const typeDefs: ITypeDefinitions[] = context.container.getAll(
          GraphQlSchemaBindings.TypeDefs
        );
        const resolvers: IResolvers[] = context.container.getAll(GraphQlSchemaBindings.Resolvers);

        return makeExecutableSchema({
          typeDefs: [baseTypeDefs, ...typeDefs],
          resolvers: [baseResolvers, ...resolvers],
          inheritResolversFromInterfaces: true,
          schemaDirectives: {
            discover: DiscoverDirective
          }
        });
      });

    if (!this.apolloClientBuilder) {
      const cache = new InMemoryCache({
        dataIdFromObject: object => object.id || null,
        cacheRedirects: {
          Query: {
            entity: (_, { id }, { getCacheKey }) => getCacheKey({ __typename: '', id: id })
          }
        }
      });
/*       await persistCache({
        cache,
        storage: window.localStorage as PersistentStorage<PersistedData<NormalizedCacheObject>>
      });
 */
      this.apolloClientBuilder = (finalLink: ApolloLink) => {
        return new ApolloClient({
          cache,
          connectToDevTools: true,
          link: finalLink
        });
      };
    }

    container
      .bind(ApolloClientModule.bindings.Client)
      .toDynamicValue((context: interfaces.Context) => {
        const schema: GraphQLSchema = context.container.get(ApolloClientModule.bindings.RootSchema);

        const links = new SchemaLink({ schema, context: { container: context.container } });

        return (this.apolloClientBuilder as ApolloClientBuilder)(links);
      });
  }
}
