export interface Derivable<T> {
  derive(object: any): Promise<T>;
  extract(derivedObject: T): object;
}
