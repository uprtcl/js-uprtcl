export type Property<T> = {
  [key: string]: (pattern: T) => any;
} & any;

/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export interface Pattern extends Property<any> {
  recognize: (object: object) => boolean;
}

export interface Entity extends Pattern {
  name: string;
}
