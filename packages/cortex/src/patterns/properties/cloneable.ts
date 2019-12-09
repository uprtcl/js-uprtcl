import { Property } from '../pattern';

export interface Cloneable<T> extends Property<T> {
  clone: (pattern: any) => Promise<string>;
}
