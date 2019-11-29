import { MergeStrategy } from '../merge/merge-strategy';

export interface Mergeable {
  merge: (ancestor: any, modifications: any[], strategy: MergeStrategy) => Promise<any>;
}
