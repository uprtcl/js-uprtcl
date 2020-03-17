import { Hashed } from '@uprtcl/cortex';
import { KnownSourcesService } from '../services/known-sources.service';
import { Source } from './source';

/**
 * A source is a service that implements a standard function `get`,
 * which receives the hash of the object and returns it
 */
export interface Store extends Source {
  hashRecipe: any;

  /**
   * Put the object and returns its hash, as computed by the provider
   * @param object the object
   * @returns the hash of the object obtained based on the hashRecipe
   */
  put(object: object): Promise<string>;

  /**
   * Put the object with its expected hash, it should throw if the hash 
   * computed by the provider is diferent from the expected one.
   * @param object the object
   * @returns the hash of the object obtained based on the hashRecipe
   */
  clone(entity: Hashed<object>): Promise<string>;
}
