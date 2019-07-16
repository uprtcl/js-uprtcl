import { Pattern, Properties } from './pattern';

export interface LinkedProperties extends Properties {
  getLinks: () => Promise<string[]>;
  getSoftLinks: () => Promise<string[]>;
  getHardLinks: () => string[];
}

export interface Linked {
  links: string[];
}

export const softLinkedProperties = (
  getSoftLinks: () => Promise<string[]>,
  getHardLinks: () => string[]
): LinkedProperties => {
  const getLinks = () => getSoftLinks().then(links => getHardLinks().concat(links));
  return { getSoftLinks, getHardLinks, getLinks };
};

export const linkedPattern: Pattern<Linked, LinkedProperties> = {
  recognize: (object: object) => object['links'] !== undefined,

  properties(object: Linked): LinkedProperties {
    const getSoftLinks = () => Promise.resolve([]);
    const getHardLinks = () => object.links;
    const getLinks = () => getSoftLinks().then(links => getHardLinks().concat(links));

    return { getSoftLinks, getHardLinks, getLinks };
  }
};
