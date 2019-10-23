export interface Cloneable {
  clone: (object: object) => Promise<string>;
}
