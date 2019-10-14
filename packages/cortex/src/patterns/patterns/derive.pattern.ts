export interface DerivePattern<T> {
  derive(object: object): Promise<T>;
  extract(derivedObject: T): object;
}
