export interface MergePattern<T> {
  merge: (from: T, to: T) => Promise<T>;
}
