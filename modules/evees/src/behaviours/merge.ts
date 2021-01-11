import { Behaviour } from '@uprtcl/cortex';

import { Evees } from 'src/services/evees.service';
import { MergeStrategy } from '../merge/merge-strategy';

export interface Merge<T = any> extends Behaviour<T> {
  merge: (
    ancestor: T
  ) => (
    modifications: any[],
    strategy: MergeStrategy,
    evees: Evees,
    config: any,
    parentId?: string
  ) => Promise<any>;
}
