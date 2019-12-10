import { Property } from '../pattern';

export interface IsValid<T = any> extends Property<T> {
  validate: (pattern: T) => Promise<boolean>;
}
