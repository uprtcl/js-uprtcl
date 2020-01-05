import { interfaces } from 'inversify';
import { ITypeDefinitions, IResolvers } from 'graphql-tools';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { ApolloClientModule } from './apollo-client.module';

export class GraphQlSchemaModule extends MicroModule {
  dependencies = [ApolloClientModule.id];

  static types = {
    TypeDefs: Symbol('graphql-type-defs'),
    Resolvers: Symbol('graphql-resolvers')
  };

  constructor(protected typeDefs: ITypeDefinitions, protected resolvers: IResolvers) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind<ITypeDefinitions>(GraphQlSchemaModule.types.TypeDefs).toConstantValue(this.typeDefs);
    container.bind<IResolvers>(GraphQlSchemaModule.types.Resolvers).toConstantValue(this.resolvers);
  }
}
