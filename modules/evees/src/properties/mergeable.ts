import { MergeStrategy } from '../merge/merge-strategy';
import { Property } from '@uprtcl/cortex';

export interface Mergeable<T = any> extends Property<T> {
  merge: (ancestor: T) => (modifications: any[], strategy: MergeStrategy, config: any) => Promise<any>;
}
