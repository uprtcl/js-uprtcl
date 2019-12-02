import { injectable, inject } from 'inversify';

import { Pattern, Hashed, Creatable } from '@uprtcl/cortex';

import { WikiNode, WikisTypes } from '../types';
import { Wikis } from '../services/wikis';

const propertyOrder = ['title', 'type', 'pages'];

@injectable()
export class WikiNodePattern implements Pattern, Creatable<Partial<WikiNode>, WikiNode> {
  constructor(@inject(WikisTypes.Wikis) protected wikis: Wikis) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node?: Partial<WikiNode>, upl?: string): Promise<Hashed<WikiNode>> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';
    const type = node && node.type ? node.type : 'Wiki';

    const newWikiNode = { pages, title, type };
    return this.wikis.createWikiNode(newWikiNode, upl);
  };
}
