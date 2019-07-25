export interface ValidatePattern<O> {
  validate: (object: O) => boolean;
}
