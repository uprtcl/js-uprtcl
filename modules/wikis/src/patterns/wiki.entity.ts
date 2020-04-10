import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Pattern, Entity, recognizeEntity, HasChildren, New } from '@uprtcl/cortex';
import { Merge, MergeStrategy, mergeStrings, UprtclAction } from '@uprtcl/evees';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Wiki } from '../types';

const propertyOrder = ['title', 'pages'];

const logger = new Logger('WIKI-ENTITY');

export class WikiEntity extends Pattern<Wiki> {
  recognize(object: object): boolean {
    return recognizeEntity(object) && propertyOrder.every(p => object.entity.hasOwnProperty(p));
  }

  type = 'Wiki';
}

@injectable()
export class WikiLinks implements HasChildren<Entity<Wiki>>, Merge<Entity<Wiki>> {
  replaceChildrenLinks = (wiki: Entity<Wiki>) => (childrenHashes: string[]): Entity<Wiki> => ({
    ...wiki,
    entity: {
      ...wiki.entity,
      pages: childrenHashes
    }
  });

  getChildrenLinks: (wiki: Entity<Wiki>) => string[] = (wiki: Entity<Wiki>): string[] =>
    wiki.entity.pages;

  links: (wiki: Entity<Wiki>) => Promise<string[]> = async (wiki: Entity<Wiki>) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Entity<Wiki>) => async (
    modifications: Entity<Wiki>[],
    mergeStrategy: MergeStrategy,
    config
  ): Promise<[Wiki, UprtclAction[]]> => {
    const resultTitle = mergeStrings(
      originalNode.entity.title,
      modifications.map(data => data.entity.title)
    );

    const [mergedPages, actions] = await mergeStrategy.mergeLinks(
      originalNode.entity.pages,
      modifications.map(data => data.entity.pages),
      config
    );

    return [
      {
        pages: mergedPages,
        title: resultTitle
      },
      actions
    ];
  };
}

@injectable()
export class WikiCommon implements HasLenses<Entity<Wiki>>, New<Partial<Wiki>, Wiki> {
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
              .ref=${entity.id}
              color=${context.color}
              .selectedPageHash=${context.selectedPageHash}
            >
            </wiki-drawer>
          `;
        }
      }
    ];
  };

  new = () => async (node: Partial<Wiki>): Promise<Wiki> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';

    return { pages, title };
  };
}
