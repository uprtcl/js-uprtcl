import { interfaces } from 'inversify';
import { ITypeDefinitions, IResolvers } from 'graphql-tools';

import { Constructor, MicroModule } from '@uprtcl/micro-orchestrator';

import { GraphQlSchemaBindings } from './bindings';
import { ApolloClientModule } from './apollo-client.module';
import { NamedDirective } from './types';

export class GraphQlSchemaModule extends MicroModule {
  dependencies = [ApolloClientModule.id];

  static bindings = GraphQlSchemaBindings;

  constructor(
    protected typeDefs: ITypeDefinitions,
    protected resolvers: IResolvers = {},
    protected directives: Array<Constructor<NamedDirective>> = []
  ) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container
      .bind<ITypeDefinitions>(GraphQlSchemaModule.bindings.TypeDefs)
      .toConstantValue(this.typeDefs);
    container
      .bind<IResolvers>(GraphQlSchemaModule.bindings.Resolvers)
      .toConstantValue(this.resolvers);
    this.directives.map((directive) =>
      container.bind(GraphQlSchemaModule.bindings.Directive).toConstantValue(directive)
    );
  }
}
