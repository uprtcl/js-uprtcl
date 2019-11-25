export interface HasLinks {
  getLinks: (object: any) => Promise<string[]>;
  getSoftLinks: (object: any) => Promise<string[]>;
  getHardLinks: (object: any) => string[];

  addChildrenLinks?: <T>(object: T, childrenHashes: string[]) => T;
}
