import { html, TemplateResult } from 'lit-element';
import { injectable, inject } from 'inversify';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Pattern, Hashed, Hashable, Entity, HasChildren } from '@uprtcl/cortex';
import { Mergeable, EveesModule, MergeStrategy, mergeStrings, UprtclAction, DiffLens, HasDiffLenses } from '@uprtcl/evees';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { NodeActions } from '@uprtcl/evees';

const propertyOrder = ['title', 'pages'];

const logger = new Logger('WIKI-ENTITY');

@injectable()
export class WikiEntity implements Entity {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {}

  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'Wiki';
}

@injectable()
export class WikiLinks extends WikiEntity implements HasChildren, Mergeable {

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  replaceChildrenLinks = (wiki: Wiki) => (childrenHashes: string[]): Wiki => ({
    ...wiki,
    pages: childrenHashes
  });

  getChildrenLinks: (wiki: Wiki) => string[] = (wiki: Wiki): string[] =>
    wiki.pages;

  links: (wiki: Wiki) => Promise<string[]> = async (wiki: Wiki) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Wiki) => async (
    modifications: Wiki[],
    mergeStrategy: MergeStrategy,
    config
  ): Promise<NodeActions<Wiki>> => {
    const resultTitle = mergeStrings(
      originalNode.title,
      modifications.map(data => data.title)
    );

    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.pages,
      modifications.map(data => data.pages),
      config
    );

    const allActions = ([] as UprtclAction[]).concat(...mergedPages.map(node => node.actions));
    
    return {
      new: {
        pages: mergedPages.map(node => node.new),
        title: resultTitle
      },
      actions: allActions
    };
  };
}

@injectable()
export class WikiCommon extends WikiEntity implements HasLenses, HasDiffLenses {
  
  lenses = (wiki: Hashed<Wiki>): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (lensContent: TemplateResult, context: any) => {
          logger.info('lenses() - Wiki', { wiki, lensContent, context });
          return html`
            <wiki-drawer
              .data=${wiki}
              .ref=${context.ref}
              color=${context.color}
              .selectedPageHash=${context.selectedPageHash}
            >
              ${lensContent}
            </wiki-drawer>
          `;
        }
      }
    ];
  };

  diffLenses = (node?: Hashed<Wiki>): DiffLens[] => {
    return [
      {
        name: 'wikis:wiki-diff',
        type: 'diff',
        render: (newEntity: Hashed<Wiki>, oldEntity: Hashed<Wiki>) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <wiki-diff
              .newData=${newEntity}
              .oldData=${oldEntity}>
            </wiki-diff>
          `;
        }
      }
    ];
  };
}
