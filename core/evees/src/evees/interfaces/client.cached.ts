import { Client } from './client';
import { ClientCache } from './client.cache';
import { EveesMutation, SearchOptions } from './types';

/** A ClientCached is a Client that can batch mutations and store them (anywhere).
 * It is built on top of another Client, and, thus, the mutations it store are to be
 * considered to be applied on top of the base client data.
 *
 * A ClientCached also offer methods to see the current changes and to flush them (apply them
 * as an update) on the base client.
 */
export interface ClientCached extends Client {
  cache: ClientCache;

  /** get all the changes relative to the underlying client(s) */
  diff(options?: SearchOptions): Promise<EveesMutation>;
  /** sync all the temporary changes made on this client with the base layer, if recurse
   * then flush the base layer too recursively */
  flush(options?: SearchOptions, recurse?: boolean, condensate?: boolean): Promise<void>;
  /** delete all changes done and cached in this client. */
  clear?(options?: SearchOptions): Promise<void>;
}
