export interface Source {
  /**
   *
   * @param hash the hash identifying the object
   */
  get<T>(hash: string): Promise<T | undefined>;
}
