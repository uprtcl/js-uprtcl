export interface CreatePattern<T, O, R> {
  create: (service: T, object: O) => Promise<R>;
}
