import { MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { accessControlTypes } from './graphql/schema';
import { accessControlResolvers } from './graphql/resolvers';
import { PermissionsForEntity } from './elements/permissions-for-entity';
import { PermissionsOwner } from './elements/permissions-owner';
import { OwnerPattern, OwnerBehaviour } from './patterns/owner.pattern';
import {
  BasicAdminPattern,
  AdminBehaviour,
} from './patterns/basic-admin-control.pattern';

import en from './i18n/en.json';
import { PermissionsAdmin } from './elements/permissions-admin';
import { RemoteLoginWidget } from './elements/remote-login-widget';
import { AccessControlBindings } from './bindings';
import {
  DaoOwnerPattern,
  DaoOwnerBehaviour,
} from './patterns/dao-owner.pattern';
import { PermissionsDAO } from './elements/permissions-dao';
import { ProgressBar } from './elements/progress-bar';
import { ProposalUI } from './elements/proposal-ui';

export class AccessControlModule extends MicroModule {
  static id = 'access-control-module';

  async onLoad() {
    customElements.define('permissions-for-entity', PermissionsForEntity);
    customElements.define('permissions-owner', PermissionsOwner);
    customElements.define('permissions-admin', PermissionsAdmin);
    customElements.define('permissions-dao', PermissionsDAO);
    customElements.define('remote-login-widget', RemoteLoginWidget);
    customElements.define('proposal-ui', ProposalUI);
    customElements.define('progress-bar', ProgressBar);
  }

  get submodules() {
    return [
      new i18nextModule('access-control', { en }),
      new GraphQlSchemaModule(accessControlTypes, accessControlResolvers),
      new PatternsModule([
        new OwnerPattern([OwnerBehaviour]),
        new BasicAdminPattern([AdminBehaviour]),
        new DaoOwnerPattern([DaoOwnerBehaviour]),
      ]),
    ];
  }

  static bindings = AccessControlBindings;
}
