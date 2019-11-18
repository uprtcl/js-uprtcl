import { injectable, interfaces } from 'inversify';
import { ApolloClient, InMemoryCache, ApolloLink } from 'apollo-boost';
import { SchemaLink } from 'apollo-link-schema';
import { setContext } from 'apollo-link-context';
import { GraphQLSchema } from 'graphql';
import { mergeSchemas } from 'graphql-tools';

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
    bind(GraphQlTypes.Client).toDynamicValue((context: interfaces.Context) => {
      const schemas: GraphQLSchema[] = context.container.getAll(GraphQlTypes.Schema);
      const schema = mergeSchemas({ schemas });

      return new ApolloClient({
        cache: new InMemoryCache(),
        connectToDevTools: true,
        link: new SchemaLink({ schema, context: context.container })
      });
    });
  }

  async onUnload() {}
}
