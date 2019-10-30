import { Hashed } from '../../patterns/properties/hashable';

export interface Ready {
  /**
   * Waits until the connection is ready to process calls
   */
  ready(): Promise<void>;
}

/**
 * A source is a service that implements a standard function `get`,
 * which receives the hash of the object and returns it
 */
export interface Source extends Ready {
  /**
   * Get the object identified by the given hash,
   * or undefined if it didn't exist in the source
   *
   * @param hash the hash identifying the object
   * @returns the object if found, otherwise undefined
   */
  get<T extends object>(hash: string): Promise<Hashed<T> | undefined>;
}
