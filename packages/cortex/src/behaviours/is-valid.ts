import { Behaviour } from '../types/behaviour';

export interface IsValid<T = any> extends Behaviour<T> {
  validate: (pattern: T) => Promise<boolean>;
}
