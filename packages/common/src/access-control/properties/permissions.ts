import { Property } from '@uprtcl/cortex';

export interface Permissions<T> extends Property<T> {
  canWrite: (permissions: T) => (userId: string | undefined) => boolean;
}
