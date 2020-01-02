import { Property } from '../pattern';

export interface HasContent<T = any> extends Property<T> {
  content: (pattern: T) => Promise<any>;
}
