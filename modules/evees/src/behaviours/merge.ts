import { Behaviour } from '@uprtcl/cortex';

import { MergeStrategy } from '../merge/merge-strategy';
import { EveesWorkspace } from '../services/evees.workspace';

export interface Merge<T = any> extends Behaviour<T> {
  merge: (
    ancestor: T
  ) => (
    modifications: any[],
    strategy: MergeStrategy,
    workspace: EveesWorkspace,
    config: any,
    parentId?: string
  ) => Promise<any>;
}
