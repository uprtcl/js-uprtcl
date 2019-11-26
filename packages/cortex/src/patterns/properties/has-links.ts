export interface HasLinks {
  getLinks: (object: any) => Promise<string[]>;
  getSoftLinks: (object: any) => Promise<string[]>;
  getHardLinks: (object: any) => string[];

  replaceChildrenLinks: (object: any, links: string[]) => any;
}
