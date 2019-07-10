export interface Source {
  /**
   * Get the object identified by the given hash,
   * or undefined if it didn't exist in the source
   *
   * @param hash the hash identifying the object
   */
  get<T extends object>(hash: string): Promise<T | undefined>;
}
