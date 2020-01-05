import { Property } from '../pattern';

export interface Transformable<R extends Array<any>, T = any> extends Property<T> {
  transform: (pattern: T) => R;
}
