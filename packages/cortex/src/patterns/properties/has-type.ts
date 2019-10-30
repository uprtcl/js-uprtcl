export interface HasType<T> {
  getType(object: object): T;
}
