export interface HasLinks {
  getLinks: (object: any) => Promise<string[]>;
}

export interface HasChildren extends HasLinks {
  getChildrenLinks: (object: any) => string[];

  replaceChildrenLinks: (object: any, links: string[]) => any;
}
