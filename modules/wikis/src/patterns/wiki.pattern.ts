import { html } from 'lit-element';

import {
  Logger,
  mergeStrings,
  MergeConfig,
  HasTitle,
  HasChildren,
  HasEmpty,
  Pattern,
  Evees,
  MergeStrategy,
} from '@uprtcl/evees';

import { HasDiffLenses, DiffLens, HasLenses, Lens } from '@uprtcl/evees-ui';

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

export class WikiLinks implements HasChildren<Wiki>, HasEmpty<Wiki> {
  replaceChildren = (wiki: Wiki) => (childrenHashes: string[]): Wiki => ({
    ...wiki,
    pages: childrenHashes,
  });

  children: (wiki: Wiki) => string[] = (wiki: Wiki): string[] => wiki.pages;

  empty = (): Wiki => {
    return { title: '', pages: [] };
  };

  merge = (originalNode: Wiki) => async (
    modifications: Wiki[],
    merger: MergeStrategy,
    config: MergeConfig
  ): Promise<Wiki> => {
    const mergedTitle = mergeStrings(
      originalNode.title,
      modifications.map((data) => (!!data ? data.title : originalNode.title))
    );

    if (!merger.mergeChildren) throw new Error('mergeChildren function not found in merger');

    const recurse = config.recurse === undefined ? true : config.recurse;
    const mergedPages = recurse
      ? await merger.mergeChildren(
          originalNode.pages,
          modifications.map((data) => data.pages),
          config
        )
      : originalNode.pages;

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
        render: (evees: Evees, newEntity: Wiki, oldEntity: Wiki, summary: boolean) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <wiki-diff
              .localEvees=${evees}
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
