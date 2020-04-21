import { Behaviour } from '../types/behaviour';

export interface HasLinks<T = any> extends Behaviour<T> {
  links: (pattern: T) => Promise<string[]>;
}

export interface HasChildren<T = any> extends HasLinks<T> {
  getChildrenLinks: (pattern: T) => string[];

  replaceChildrenLinks: (pattern: T) => (links: string[]) => any;
}
