import { CASSource } from './cas-source';

/**
 * A CASStore is a CASSource that can also store generic objects, returning their hash
 */
export interface CASStore extends CASSource {
  hashRecipe: any;

  /**
   * Put the given object and returns its hash, as computed by the service
   * 
   * @param object the object to store
   * @param hash the hash of the object to get the hashRecipe from, if not given the default hashRecipe will be used to calculate the has
   * @returns the hash of the object
   * @throws error if a hash was provided and it didn't match the generated hash
   */
  put(object: object, hash?: string): Promise<string>;
}
