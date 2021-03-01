import { Behaviour } from '../interfaces/behaviour';

export interface HasChildren<T = any> extends Behaviour<T> {
  children: (pattern: T) => string[];

  replaceChildren: (pattern: T) => (links: string[]) => any;
}
