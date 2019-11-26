export interface Mergeable {
  merge: <T>(to: T, from: T, ancestor: T) => Promise<T>;
}
