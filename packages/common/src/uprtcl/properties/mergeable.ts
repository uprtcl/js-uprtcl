export interface Merge<T> {
  merge: (from: T, to: T) => Promise<T>;
}
