import { Entity } from 'src/services/node_modules/@uprtcl/cortex';

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
   * Get the objects identified by the given hashes
   *
   * @param hash the hash identifying the object
   * @returns the object if found, otherwise undefined
   */
  get(hashes: string[]): Promise<Entity<any>[]>;
}
