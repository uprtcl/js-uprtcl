import { Property } from '@uprtcl/cortex';

import { MergeStrategy } from '../merge/merge-strategy';
import { NodeActions } from '../types';

export interface Mergeable<T = any> extends Property<T> {
  merge: (
    ancestor: T
  ) => (
    modifications: any[],
    strategy: MergeStrategy,
    config: any
  ) => Promise<NodeActions<any>>;
}
