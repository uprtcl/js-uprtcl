
/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export interface Pattern {
  recognize: (object: object) => boolean;
}
