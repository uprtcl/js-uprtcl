export interface CreatePattern<O, R, T> {
  create: (object: O, service: T) => Promise<R>;
}
