import { interfaces } from 'inversify';
import { ITypeDefinitions, IResolvers } from 'graphql-tools';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { GraphQlSchemaBindings } from './bindings';
import { ApolloClientModule } from './apollo-client.module';

export class GraphQlSchemaModule extends MicroModule {
  dependencies = [ApolloClientModule.id];

  static bindings = GraphQlSchemaBindings;

  constructor(protected typeDefs: ITypeDefinitions, protected resolvers: IResolvers) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container
      .bind<ITypeDefinitions>(GraphQlSchemaModule.bindings.TypeDefs)
      .toConstantValue(this.typeDefs);
    container
      .bind<IResolvers>(GraphQlSchemaModule.bindings.Resolvers)
      .toConstantValue(this.resolvers);
  }
}
