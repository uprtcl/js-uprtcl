import { Behaviour } from '../types/behaviour';

export interface HasRedirect<T = any> extends Behaviour<T> {
  redirect: (pattern: T) => Promise<string | undefined>;
}
