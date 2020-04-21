import { Behaviour } from '../types/behaviour';

export interface PatternAction {
  icon: string;
  title: string;
  action: (changeContent: (newContent: any) => void) => any;
  type?: string;
}

export interface HasActions<T = any> extends Behaviour<T> {
  /**
   * @returns the actions available for the given object
   */
  actions: (pattern: T) => PatternAction[];
}
