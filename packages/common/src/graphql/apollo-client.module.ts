import { injectable, interfaces } from 'inversify';
import { ApolloClient, InMemoryCache } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { GraphQLSchema } from 'graphql';
import { ITypeDefinitions, makeExecutableSchema, IResolvers } from 'graphql-tools';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { GraphQlTypes } from '../types';
import { baseTypeDefs, baseResolvers } from './base-schema';

@injectable()
export class ApolloClientModule implements MicroModule {
  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) {
    bind(GraphQlTypes.RootSchema).toDynamicValue((context: interfaces.Context) => {
      const typeDefs: ITypeDefinitions[] = context.container.getAll(GraphQlTypes.TypeDefs);
      const resolvers: IResolvers[] = context.container.getAll(GraphQlTypes.Resolvers);

      return makeExecutableSchema({
        typeDefs: [baseTypeDefs, ...typeDefs],
        resolvers: [baseResolvers, ...resolvers]
      });
    });

    bind(GraphQlTypes.Client).toDynamicValue((context: interfaces.Context) => {
      const schema: GraphQLSchema = context.container.get(GraphQlTypes.RootSchema);

      return new ApolloClient({
        cache: new InMemoryCache(),
        connectToDevTools: true,
        link: new SchemaLink({ schema, context: context.container })
      });
    });
  }
}
