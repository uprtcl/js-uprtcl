import { MicroModule, ElementsModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { accessControlResolvers, accessControlTypes } from './graphql';
import { OwnerPattern } from './patterns/owner.pattern';
import { PermissionsOwner } from './elements/permissions-owner';
import { PermissionsForEntity } from './elements/permissions-for-entity';

export class AccessControlModule extends MicroModule {
  static id = Symbol('access-control-module');

  submodules = [
    new ElementsModule({
      'permissions-for-entity': PermissionsForEntity,
      'permissions-owner': PermissionsOwner
    }),
    new GraphQlSchemaModule(accessControlTypes, accessControlResolvers),
    new PatternsModule({
      [AccessControlModule.bindings.OwnerPattern]: [OwnerPattern]
    })
  ];

  static bindings = {
    OwnerPattern: Symbol('owner-pattern')
  };
}
