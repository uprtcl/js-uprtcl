import { Behaviour } from '@uprtcl/cortex';

export interface HasRedirect<T = any> extends Behaviour<T> {
  /**
   * Returns the entity link to which the given entity redirects
   */
  redirect: (entity: T) => Promise<string | undefined>;
}
