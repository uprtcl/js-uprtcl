import { Behaviour } from '@uprtcl/cortex';

import { MergeStrategy } from '../merge/merge-strategy';
import { EveesClient } from '../services/evees.client.memory';

export interface Merge<T = any> extends Behaviour<T> {
  merge: (
    ancestor: T
  ) => (
    modifications: any[],
    strategy: MergeStrategy,
    client: EveesClient,
    config: any,
    parentId?: string
  ) => Promise<any>;
}
