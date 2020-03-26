import { CASSource } from './cas-source';
import { CidConfig } from './cid-config';

/**
 * A CASStore is a CASSource that can also store generic objects, returning their hash
 */
export interface CASStore extends CASSource {
  /**
   * Configuration with which to create objects in this store
   */
  cidConfig: CidConfig;

  /**
   * Create the given object and returns its hash, as computed by the service
   * 
   * @param object the object to store
   * @param hash (optional) the hash of the object with which it will be stored. If not given the default cidConfig will be used to calculate the hash.
   * @returns the hash of the object
   * @throws error if a hash was provided and it didn't match the generated hash
   */
  create(object: object, hash?: string): Promise<string>;
}
