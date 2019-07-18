export interface ClonePattern<T, O> {
  clone: (service: T, object: O) => Promise<string>;
}
