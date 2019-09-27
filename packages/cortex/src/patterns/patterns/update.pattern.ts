

export interface UpdatePattern<T extends object = any, C = any> {
  /**
   * @returns whether the entity needs to be reloaded or not
   */
  update: (entity: T, newContent: C) => Promise<boolean>;
}
