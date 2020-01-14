import { html, TemplateResult } from 'lit-element';
import { injectable, inject } from 'inversify';

import { CorePatterns } from '@uprtcl/common';
import { Pattern, Hashed, Hashable, Entity, Creatable, HasChildren } from '@uprtcl/cortex';
import { Mergeable, MergeStrategy, mergeStrings, mergeResult } from '@uprtcl/evees';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { WikiBindings } from '../bindings';
import { Wikis } from '../services/wikis';

const propertyOrder = ['title', 'pages'];

@injectable()
export class WikiEntity implements Entity {
  constructor(@inject(CorePatterns.Hashed) protected hashedPattern: Pattern & Hashable<any>) {}

  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'Wiki';
}

@injectable()
export class WikiLinks extends WikiEntity implements HasChildren, Mergeable {
  replaceChildrenLinks = (wiki: Hashed<Wiki>) => (childrenHashes: string[]): Hashed<Wiki> => ({
    ...wiki,
    object: {
      ...wiki.object,
      pages: childrenHashes
    }
  });

  getChildrenLinks: (wiki: Hashed<Wiki>) => string[] = (wiki: Hashed<Wiki>): string[] =>
    wiki.object.pages;

  links: (wiki: Hashed<Wiki>) => Promise<string[]> = async (wiki: Hashed<Wiki>) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Hashed<Wiki>) => async (
    modifications: Hashed<Wiki>[],
    mergeStrategy: MergeStrategy
  ): Promise<Wiki> => {
    const resultTitle = mergeStrings(
      originalNode.object.title,
      modifications.map(data => data.object.title)
    );

    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.object.pages,
      modifications.map(data => data.object.pages)
    );

    return {
      pages: mergedPages,
      title: resultTitle
    };
  };
}

@injectable()
export class WikiCommon extends WikiEntity implements HasLenses {
  lenses = (wiki: Hashed<Wiki>): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (lensContent: TemplateResult) => html`
          <wiki-drawer .wiki=${wiki}>${lensContent}</wiki-drawer>
        `
      }
    ];
  };
}

@injectable()
export class WikiCreate implements Creatable<Partial<Wiki>> {
  constructor(@inject(WikiBindings.Wikis) protected wikis: Wikis) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = () => async (node?: Partial<Wiki>, upl?: string): Promise<string> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';

    const newWiki = { pages, title };
    const { id } = await this.wikis.createWiki(newWiki, upl);
    return id;
  };
}
