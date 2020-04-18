import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { accessControlTypes } from './graphql/schema';
import { accessControlResolvers } from './graphql/resolvers';
import { PermissionsForEntity } from './elements/permissions-for-entity';
import { PermissionsOwner } from './elements/permissions-owner';
import { OwnerPattern } from './patterns/owner.pattern';
import { BasicAdminPattern } from './patterns/basic-admin-control.pattern';

import en from './i18n/en.json';
import { PermissionsAdmin } from './elements/permissions-admin';
import { RemoteLoginWidget } from './elements/remote-login-widget';

export class AccessControlModule extends MicroModule {
  static id = 'access-control-module';

  async onLoad() {
    customElements.define('permissions-for-entity', PermissionsForEntity);
    customElements.define('permissions-owner', PermissionsOwner);
    customElements.define('permissions-admin', PermissionsAdmin);
    customElements.define('remote-login-widget', RemoteLoginWidget);
  }

  submodules = [
    new i18nextModule('access-control', { en }),
    new GraphQlSchemaModule(accessControlTypes, accessControlResolvers),
    new PatternsModule({
      [AccessControlModule.bindings.OwnerPattern]: [OwnerPattern],
      [AccessControlModule.bindings.BasicAdminPattern]: [BasicAdminPattern],
    }),
  ];

  static bindings = {
    OwnerPattern: 'owner-pattern',
    BasicAdminPattern: 'basic-admin-pattern',
    Authority: 'authority'
  };
}
