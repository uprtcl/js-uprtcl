// Required by inversify
import 'reflect-metadata';

/** Access Control */
export { Updatable } from './behaviours/updatable';
export { Permissions } from './behaviours/permissions';

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
