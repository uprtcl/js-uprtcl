import { MicroModule, ElementsModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { accessControlTypes } from './graphql/schema';
import { accessControlResolvers } from './graphql/resolvers';
import { PermissionsForEntity } from './elements/permissions-for-entity';
import { PermissionsOwner } from './elements/permissions-owner';
import { OwnerPattern } from './patterns/owner.pattern';
import { BasicAdminPattern } from './patterns/basic-admin-control.pattern';

import en from '../i18n/en.json';

export class AccessControlModule extends MicroModule {
  static id = Symbol('access-control-module');

  submodules = [
    new ElementsModule({
      'permissions-for-entity': PermissionsForEntity,
      'permissions-owner': PermissionsOwner
    }),
    new i18nextModule('access-control', { en }),
    new GraphQlSchemaModule(accessControlTypes, accessControlResolvers),
    new PatternsModule({
      [AccessControlModule.bindings.OwnerPattern]: [OwnerPattern],
      [AccessControlModule.bindings.BasicAdminPattern]: [BasicAdminPattern]
    })
  ];

  static bindings = {
    OwnerPattern: Symbol('owner-pattern'),
    BasicAdminPattern: Symbol('basic-admin-pattern')
  };
}
