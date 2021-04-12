import { Behaviour } from '../../patterns/interfaces/behaviour';
import { MergeStrategy } from './merge-strategy';

export enum MergingBehaviorNames {
  MERGE = 'merge',
}

export interface HasMerge<T = any> extends Behaviour<T> {
  [MergingBehaviorNames.MERGE]: (
    ancestor: T
  ) => (modifications: any[], strategy: MergeStrategy, config: any) => Promise<any>;
}
