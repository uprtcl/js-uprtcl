import { Behaviour } from '../interfaces/behaviour';

export interface HasLinks<T = any> extends Behaviour<T> {
  links: (pattern: T) => Promise<string[]>;
}

export interface HasChildren<T = any> extends HasLinks<T> {
  children: (pattern: T) => string[];

  replaceChildren: (pattern: T) => (links: string[]) => any;
}
