import { Property } from '../pattern';

export interface HasTitle<T = any> extends Property<T> {
  title: (pattern: T) => string;
}
