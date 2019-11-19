import { injectable, interfaces } from 'inversify';
import { ApolloClient, InMemoryCache, ApolloLink } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { setContext } from 'apollo-link-context';
import {
  GraphQLSchema,
  GraphQLType,
  GraphQLResolveInfo,
  GraphQLNamedType,
  DocumentNode
} from 'graphql';
import { mergeSchemas, MergeInfo, IResolvers } from 'graphql-tools';

import { MicroModule } from '../micro.module';
import { GraphQlTypes } from '../../types';

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
      const typeDefs: (
        | string
        | GraphQLSchema
        | DocumentNode
        | GraphQLNamedType[]
      )[] = context.container.getAll(GraphQlTypes.TypeDef);
      const resolversList: Array<
        | IResolvers<any, any>
        | (IResolvers<any, any> | ((mergeInfo: MergeInfo) => IResolvers<any, any>))[]
        | ((mergeInfo: MergeInfo) => IResolvers<any, any>)
        | undefined
      > = context.container.getAll(GraphQlTypes.Resolver);

      const resolvers = resolversList.reduce((acc, current) => ({ ...acc, ...current }));

      return mergeSchemas({ schemas: typeDefs, resolvers });
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

  async onUnload() {}
}
