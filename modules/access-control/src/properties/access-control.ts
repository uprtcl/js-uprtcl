import { Property } from '@uprtcl/cortex';

export interface AccessControl<T> extends Property<T> {
  canWrite: (entity: T) => boolean;
}
