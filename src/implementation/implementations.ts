import { Implementation } from './types';

export const linkedImpl: Implementation<{ links: string[] }> = {
  implements: object => !!object.links,
  getLinks: object => object.links
};

export const textImpl: Implementation<{ text: string }> = {
  implements: object => !!object.text,
  getContents: object => ({ text: object.text })
};
