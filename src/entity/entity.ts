/**
 * An Entity is an "extension" of an object with a specified schema
 * It adds functions and behaviour to that schema
 */
export class Entity<T extends object> {
  // The object that this entity represents
  object!: T;

  constructor(protected options: any = {}) {}

  init(object: any): void {
    this.object = this.setupObject(object);
  }

  setupObject(object: any): T {
    return object as T;
  }

  /**
   * @returns all the ordered properties of the schema that this entity represents
   */
  getProperties(): string[] {
    return [];
  }
}
