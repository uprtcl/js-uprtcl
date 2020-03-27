export type Behaviour<T> = {
  [key: string]: (pattern: T) => any;
} & any;
