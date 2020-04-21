import { Behaviour } from '@uprtcl/cortex';

export interface Permissions<T> extends Behaviour<T> {
  canWrite: (permissions: T) => (userId: string | undefined) => boolean;
}
