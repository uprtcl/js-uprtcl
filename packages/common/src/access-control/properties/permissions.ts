import { UplAuth } from '@uprtcl/cortex';

export interface PermissionsStatus {
  canWrite: boolean;
}

export interface Permissions {
  canWrite: (permissions: any, uplAuth: UplAuth) => boolean;
}
