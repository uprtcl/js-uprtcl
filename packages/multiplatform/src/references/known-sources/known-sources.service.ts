import { Ready } from '../../types/ready';

export interface KnownSourcesService extends Ready {
  /**
   * Retrieves the list of knowns sources for the given hash
   * @param hash the identifier of the object
   * @returns the list of known sources for the given hash, or undefined we don't know the sources for the hash
   */
  getKnownSources(hash: string): Promise<string[] | undefined>;

  /**
   * Adds the given sources to the list of known sources for the given hash
   * @param hash hash of the object
   * @param sources sources to add
   */
  addKnownSources(hash: string, casIDs: string[], type?: string): Promise<void>;

  /**
   * Removes the given source from the list of known sources of the given hash
   * @param hash hash of the object
   * @param source source to remove
   */
  removeKnownSource(hash: string, casID: string): Promise<void>;
}
