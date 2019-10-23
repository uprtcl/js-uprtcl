export interface HasContent {
  getContent: (object: object) => Promise<any>;
}
