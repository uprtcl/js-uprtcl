export interface Updatable<T = any> {
  /**
   * @returns whether the entity needs to be reloaded or not
   */
  update: (entity: any, newContent: T) => Promise<boolean>;

  canUpdate: (entity: any) => boolean;
}
