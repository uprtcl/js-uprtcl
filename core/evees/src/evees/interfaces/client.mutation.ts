import { Client } from './client';
import { EveesMutation, FlushConfig, SearchOptions } from './types';

/** A ClientMutation is a Client that can batch mutations and store them in a ClientMutationStore service.
 * It is built on top of another Client, and, thus, the mutations it store are to be
 * considered to be applied on top of the base client.
 *
 * A ClientMutation offer methods to see the current changes and to flush them (apply them
 * as an update) on the base client.
 *
 * Some methods can receive an optional `options` input with the criteria to filter the
 * current mutation elements. For example, get all the changes that have been applied under
 * a given perspective. */
export interface ClientMutation extends Client {
  base: Client;

  /** get all the changes relative to the underlying client */
  diff(options?: SearchOptions): Promise<EveesMutation>;

  /** sync all the temporary changes made on this client with the base layer,
   * if levels = -1 (or undefined), then recursively flush the base layer,
   * otherwise flush only a number of layers equal to levels */
  flush(options?: SearchOptions, levels?: number): Promise<void>;

  /** delete all changes done and cached in this client. */
  clear?(mutation?: EveesMutation): Promise<void>;
}
