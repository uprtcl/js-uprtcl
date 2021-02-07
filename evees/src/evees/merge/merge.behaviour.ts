import { Behaviour } from '../../patterns/interfaces/behaviour';
import { Evees } from '../evees.service';

export interface Merge<T = any> extends Behaviour<T> {
  merge: (
    ancestor: T
  ) => (
    modifications: any[],
    strategy: any,
    evees: Evees,
    config: any,
    parentId?: string
  ) => Promise<any>;
}
