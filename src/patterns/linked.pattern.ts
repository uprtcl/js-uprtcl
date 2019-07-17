export interface LinkedPattern<O> {
  getLinks: (object: O) => Promise<string[]>;
  getSoftLinks: (object: O) => Promise<string[]>;
  getHardLinks: (object: O) => string[];
}
