
/**
 * A pattern is a behaviour that a certain kind of object implements
 * [[include:hi.md]]
 */
export interface Pattern {
  recognize: (object: object) => boolean;
}
