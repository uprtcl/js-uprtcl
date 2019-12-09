import { UplAuth, Property } from '@uprtcl/cortex';

export interface Permissions<T> extends Property<T> {
  canWrite: (permissions: T) => (uplAuth: UplAuth) => boolean;
}
