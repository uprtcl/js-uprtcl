export interface ClonePattern<O, T> {
  clone: (object: O, service: T) => Promise<string>;
}
