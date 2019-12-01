import { interfaces, injectable, inject } from 'inversify';
import { ITypeDefinitions, IResolvers } from 'graphql-tools';

import {
  Constructor,
  MicroOrchestratorTypes,
  ModuleProvider,
  MicroModule
} from '@uprtcl/micro-orchestrator';

import { GraphQlTypes } from '../types';
import { GraphQLSchema } from 'graphql';

@injectable()
export abstract class GraphQlSchemaModule implements MicroModule {
  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  abstract get typeDefs(): ITypeDefinitions;
  abstract get resolvers(): IResolvers;

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) {
    await this.moduleProvider(GraphQlTypes.Module);

    bind<ITypeDefinitions>(GraphQlTypes.TypeDefs).toConstantValue(this.typeDefs);
    bind<IResolvers>(GraphQlTypes.Resolvers).toConstantValue(this.resolvers);
  }
}

export function graphQlSchemaModule(
  typeDefs: ITypeDefinitions,
  resolvers: IResolvers
): Constructor<MicroModule> {
  @injectable()
  class SchemaModule extends GraphQlSchemaModule {
    get typeDefs(): ITypeDefinitions {
      return typeDefs;
    }
    get resolvers() {
      return resolvers;
    }
  }
  return SchemaModule;
}
