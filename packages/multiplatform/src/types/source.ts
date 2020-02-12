import { Hashed } from '@uprtcl/cortex';
import { Ready } from './ready';
import { KnownSourcesService } from '../services/known-sources.service';

/**
 * A source is a service that implements a standard function `get`,
 * which receives the hash of the object and returns it
 */
export interface Source extends Ready {
  source: string;
  hashRecipe: any;

  /**
   * If the service provider has a known source service associated, any object stored on it
   * can be linked to/from other sources
   */
  knownSources?: KnownSourcesService;

  /**
   * Get the object identified by the given hash,
   * or undefined if it didn't exist in the source
   *
   * @param hash the hash identifying the object
   * @returns the object if found, otherwise undefined
   */
  get<T extends object>(hash: string): Promise<Hashed<T> | undefined>;
}
