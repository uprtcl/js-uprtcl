import { Behaviour } from '../types/behaviour';

export interface Derivable<T = any> extends Behaviour<T> {
  derive: () => (object: any, recipe: any) => Promise<T>;
  extract: (derivedObject: T) => object;
}
