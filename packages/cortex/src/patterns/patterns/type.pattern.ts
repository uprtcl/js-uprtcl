export interface TypePattern<T> {
  getType(object: object): T;
}
