import { MicroModule } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { accessControlTypes, accessControlResolvers } from './graphql';

export class AccessControlModule extends MicroModule {
  static id = Symbol('access-control-module');

  submodules = [new GraphQlSchemaModule(accessControlTypes, accessControlResolvers)];
}
