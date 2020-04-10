
export interface New<A, T> {
  new: () => (args: A) => Promise<T>;
}
