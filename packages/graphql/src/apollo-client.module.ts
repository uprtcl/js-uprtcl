import { interfaces } from 'inversify';
import { ApolloClient, InMemoryCache, ApolloLink } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { GraphQLSchema } from 'graphql';
import { ITypedef, makeExecutableSchema, IResolvers } from 'graphql-tools';

import { MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { baseTypeDefs } from './base-schema';
import { baseResolvers } from './base-resolvers';
import { GraphQlSchemaBindings, ApolloClientBindings } from './bindings';
import { NamedDirective } from './types';

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
        const typeDefs: ITypedef[] = context.container.getAll(GraphQlSchemaBindings.TypeDefs);
        const resolvers: IResolvers[] = context.container.getAll(GraphQlSchemaBindings.Resolvers);
        const directivesArray: Constructor<NamedDirective>[] = context.container.getAll(
          GraphQlSchemaBindings.Directive
        );

        const directives = directivesArray.reduce(
          (acc, next) => ({ ...acc, [next['directive']]: next }),
          {}
        );

        return makeExecutableSchema({
          typeDefs: [baseTypeDefs, ...typeDefs],
          resolvers: [baseResolvers, ...resolvers],
          inheritResolversFromInterfaces: true,
          schemaDirectives: directives
        });
      });
    const cache = new InMemoryCache({
      dataIdFromObject: object => {
        if (object.__typename === 'Context') return `${object.__typename}:${object.id}`;
        return object.id || null;
      },
      cacheRedirects: {
        Query: {
          entity: (_, { id }, { getCacheKey }) => getCacheKey({ __typename: '', id: id })
        }
      }
    });

    if (!this.apolloClientBuilder) {
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

    let client: ApolloClient<any> | undefined = undefined;

    container
      .bind(ApolloClientModule.bindings.Client)
      .toDynamicValue((context: interfaces.Context) => {
        if (client) return client;

        const schema: GraphQLSchema = context.container.get(ApolloClientModule.bindings.RootSchema);

        const links = new SchemaLink({
          schema,
          context: { container: context.container, cache }
        });

        client = (this.apolloClientBuilder as ApolloClientBuilder)(links);
        return client;
      });
  }
}
