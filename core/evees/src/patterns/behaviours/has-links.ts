import { Behaviour } from '../interfaces/behaviour';

export enum LinkingBehaviorNames {
  LINKS_TO = 'linksTo',
  CHILDREN = 'children',
  REPLACE_CHILDREN = 'replaceChildren',
}

export interface HasLinks<T = any> extends Behaviour<T> {
  [LinkingBehaviorNames.LINKS_TO]: (pattern: T) => string[];
}

export interface HasChildren<T = any> extends Behaviour<T> {
  [LinkingBehaviorNames.CHILDREN]: (pattern: T) => string[];

  [LinkingBehaviorNames.REPLACE_CHILDREN]: (pattern: T) => (links: string[]) => any;
}
