import { interfaces, injectable, inject } from 'inversify';
import { GraphQLSchema } from 'graphql';

import { MicroModule } from '../micro.module';
import { GraphQlTypes, Constructor, MicroOrchestratorTypes } from '../../types';
import { ModuleProvider } from '../../orchestrator/module-provider';

export function graphQlSchemaModule(schema: GraphQLSchema): Constructor<MicroModule> {
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

      bind<GraphQLSchema>(GraphQlTypes.Schema).toConstantValue(schema);
    }

    async onUnload() {}
  }
  return GraphQlSchemaModule;
}
