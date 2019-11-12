import { UplAuth } from '@uprtcl/cortex';

export interface Permissions {
  canWrite: (permissions: any, uplAuth: UplAuth) => boolean;
}
