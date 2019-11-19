import { interfaces, injectable, inject } from 'inversify';
import { GraphQLSchema, DocumentNode, GraphQLNamedType } from 'graphql';
import { IResolvers, MergeInfo } from 'graphql-tools';

import { MicroModule } from '../micro.module';
import { GraphQlTypes, Constructor, MicroOrchestratorTypes } from '../../types';
import { ModuleProvider } from '../../orchestrator/module-provider';

export function graphQlSchemaModule(
  typeDefs: (string | GraphQLSchema | DocumentNode | GraphQLNamedType[])[],
  resolvers: Array<
    | IResolvers<any, any>
    | (IResolvers<any, any> | ((mergeInfo: MergeInfo) => IResolvers<any, any>))[]
    | ((mergeInfo: MergeInfo) => IResolvers<any, any>)
    | undefined
  >
): Constructor<MicroModule> {
  @injectable()
  class GraphQlSchemaModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ) {
      await this.moduleProvider(GraphQlTypes.Module);

      for (const typeDef of typeDefs) bind(GraphQlTypes.TypeDef).toConstantValue(typeDef);

      for (const resolver of resolvers) bind(GraphQlTypes.Resolver).toConstantValue(resolver);
    }

    async onUnload() {}
  }
  return GraphQlSchemaModule;
}
