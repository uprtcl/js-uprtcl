import { Ready } from './ready';
import { CidConfig } from './cid-config';

/**
 * A CASource (Content Addressable Storage Source) is a service that implements a standard function `get`,
 * which receives the hash of the object and returns it
 */
export interface CASSource extends Ready {
  /**
   * Uniquely identifies this CAS source from which to retrieve objects
   */
  casID: string;

  /**
   * Configuration with which to create objects in this store
   */
  cidConfig: CidConfig;

  /**
   * Get the object identified by the given hash,
   * or undefined if it didn't exist in the source
   *
   * @param hash the hash identifying the object
   * @returns the object if found, otherwise undefined
   */
  get(hash: string): Promise<object | undefined>;
}
