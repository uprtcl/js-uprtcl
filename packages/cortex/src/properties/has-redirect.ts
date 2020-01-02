import { Property } from '../pattern';

export interface HasRedirect<T = any> extends Property<T> {
  redirect: (pattern: T) => Promise<string | undefined>;
}
