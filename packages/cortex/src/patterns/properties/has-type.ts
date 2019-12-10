import { Property } from '../pattern';

export interface HasType<Type, T = any> extends Property<T> {
  type: (pattern: T) => Type;
}
