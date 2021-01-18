import { html } from 'lit-element';

import {
  Logger,
  mergeStrings,
  HasDiffLenses,
  DiffLens,
  Client,
  HasTitle,
  HasLenses,
  Entity,
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
  recognize(entity: any): boolean {
    return propertyOrder.every((p) => entity.object.hasOwnProperty(p));
  }

  type = WikiBindings.WikiType;
}

export class WikiLinks implements HasChildren<Entity<Wiki>> {
  replaceChildrenLinks = (wiki: Entity<Wiki>) => (childrenHashes: string[]): Entity<Wiki> => ({
    ...wiki,
    object: {
      ...wiki.object,
      pages: childrenHashes,
    },
  });

  getChildrenLinks: (wiki: Entity<Wiki>) => string[] = (wiki: Entity<Wiki>): string[] =>
    wiki.object.pages;

  links: (wiki: Entity<Wiki>) => Promise<string[]> = async (wiki: Entity<Wiki>) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Entity<Wiki>) => async (
    modifications: (Entity<Wiki> | undefined)[],
    mergeStrategy: RecursiveContextMergeStrategy,
    evees: Evees,
    config
  ): Promise<Wiki> => {
    const mergedTitle = mergeStrings(
      originalNode.object.title,
      modifications.map((data) => (!!data ? data.object.title : originalNode.object.title))
    );

    // TODO: add entity
    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.object.pages,
      modifications.map((data) => (!!data ? data.object.pages : originalNode.object.pages)),
      evees,
      config
    );

    return {
      title: mergedTitle,
      pages: mergedPages,
    };
  };
}

export class WikiCommon implements HasTitle, HasLenses<Entity<Wiki>>, HasDiffLenses<Entity<Wiki>> {
  lenses = (wiki: Entity<Wiki>): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (entity: Entity<any>, context: any) => {
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
        render: (
          client: Client,
          newEntity: Entity<Wiki>,
          oldEntity: Entity<Wiki>,
          summary: boolean
        ) => {
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

  title = (wiki: Entity<Wiki>) => wiki.object.title;
}
