import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/common';

import { accessControlResolvers, accessControlTypes } from './graphql';
import { OwnerPattern } from './patterns/owner.pattern';

export class AccessControlModule extends MicroModule {
  static id = Symbol('access-control-module');

  submodules = [
    new GraphQlSchemaModule(accessControlTypes, accessControlResolvers),
    new PatternsModule({
      [AccessControlModule.types.OwnerPattern]: [OwnerPattern]
    })
  ];

  static types = {
    OwnerPattern: Symbol('owner-pattern')
  };
}
