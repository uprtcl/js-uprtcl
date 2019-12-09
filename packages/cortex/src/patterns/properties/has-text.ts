import { Property } from '../pattern';

export interface HasText<T = any> extends Property<T> {
  text: (pattern: T) => string;
}
