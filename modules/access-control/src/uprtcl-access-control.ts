// Required by inversify
import 'reflect-metadata';

export { Authority } from './types/authority';

/** Access Control */
export { Updatable } from './properties/updatable';
export { Permissions } from './properties/permissions';

export { AccessControlModule } from './access-control.module';
export { AccessControlService } from './services/access-control.service';
export {
  OwnerPermissions,
  OwnerAccessControlService
} from './services/owner-access-control.service';

export {
  BasicAdminPermissions,
  BasicAdminAccessControlService
} from './services/basic-admin-control.service';

export { SET_CAN_WRITE } from './graphql/queries';
