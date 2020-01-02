import { Property } from '../pattern';

export interface HasLinks<T = any> extends Property<T> {
  links: (pattern: T) => Promise<string[]>;
}

export interface HasChildren<T = any> extends HasLinks<T> {
  getChildrenLinks: (pattern: T) => string[];

  replaceChildrenLinks: (pattern: T) => (links: string[]) => any;
}
