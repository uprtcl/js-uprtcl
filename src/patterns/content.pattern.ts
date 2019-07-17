export interface ContentPattern<O extends object> {
  getContent: (object: O) => Promise<any>;
}
