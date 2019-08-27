export interface DerivePattern<T> {
  derive(object: object): T;
  extract(derivedObject: T): object;
}
