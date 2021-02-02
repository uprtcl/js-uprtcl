import { html } from 'lit-element';

import {
  Logger,
  mergeStrings,
  HasDiffLenses,
  DiffLens,
  Client,
  HasTitle,
  HasLenses,
  HasChildren,
  Lens,
  Pattern,
  RecursiveContextMergeStrategy,
  Evees,
} from '@uprtcl/evees';

import { Wiki } from '../types';
import { WikiBindings } from '../bindings';

const propertyOrder = ['title', 'pages'];

const logger = new Logger('WIKI-ENTITY');

export class WikiPattern extends Pattern<Wiki> {
  recognize(object: any): boolean {
    return propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = WikiBindings.WikiType;
}

export class WikiLinks implements HasChildren<Wiki> {
  replaceChildren = (wiki: Wiki) => (childrenHashes: string[]): Wiki => ({
    ...wiki,
    pages: childrenHashes,
  });

  children: (wiki: Wiki) => string[] = (wiki: Wiki): string[] => wiki.pages;

  links: (wiki: Wiki) => Promise<string[]> = async (wiki: Wiki) => this.children(wiki);

  merge = (originalNode: Wiki) => async (
    modifications: (Wiki | undefined)[],
    mergeStrategy: RecursiveContextMergeStrategy,
    evees: Evees,
    config
  ): Promise<Wiki> => {
    const mergedTitle = mergeStrings(
      originalNode.title,
      modifications.map((data) => (!!data ? data.title : originalNode.title))
    );

    // TODO: add entity
    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.pages,
      modifications.map((data) => (!!data ? data.pages : originalNode.pages)),
      evees,
      config
    );

    return {
      title: mergedTitle,
      pages: mergedPages,
    };
  };
}

export class WikiCommon implements HasTitle, HasLenses<Wiki>, HasDiffLenses<Wiki> {
  lenses = (wiki: Wiki): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (entity: any, context: any) => {
          logger.info('lenses() - Wiki', { wiki, context });
          return html`
            <wiki-drawer
              .data=${wiki}
              .uref=${entity.id}
              color=${context.color}
              .selectedPageHash=${context.selectedPageHash}
            >
            </wiki-drawer>
          `;
        },
      },
    ];
  };

  diffLenses = (): DiffLens[] => {
    return [
      {
        name: 'wikis:wiki-diff',
        type: 'diff',
        render: (client: Client, newEntity: Wiki, oldEntity: Wiki, summary: boolean) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <wiki-diff
              .client=${client}
              .newData=${newEntity}
              .oldData=${oldEntity}
              ?summary=${summary}
            >
            </wiki-diff>
          `;
        },
      },
    ];
  };

  title = (wiki: Wiki) => wiki.title;
}
