export interface ClonePattern<O extends object> {
  clone: (object: O) => Promise<string>;
}
