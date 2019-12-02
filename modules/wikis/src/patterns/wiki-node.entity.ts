import { html, TemplateResult } from 'lit-element';
import { injectable, inject } from 'inversify';
import { Store } from 'redux';

import {
  Pattern,
  HasActions,
  PatternAction,
  Hashed,
  Hashable,
  PatternTypes,
  PatternRecognizer,
  HasChildren
} from '@uprtcl/cortex';
import { Mergeable, MergeStrategy, mergeStrings, mergeResult } from '@uprtcl/evees';
import { selectCanWrite } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { WikiNode } from '../types';

const propertyOrder = ['title', 'type', 'pages'];

@injectable()
export class WikiNodeEntity implements Pattern, HasLenses, HasChildren, HasActions, Mergeable {
  constructor(
    @inject(PatternTypes.Recognizer) protected recognizer: PatternRecognizer,
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(ReduxTypes.Store) protected store: Store
  ) {}

  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  replaceChildrenLinks = (wiki: Hashed<WikiNode>, childrenHashes: string[]): Hashed<WikiNode> => ({
    ...wiki,
    object: {
      ...wiki.object,
      pages: childrenHashes
    }
  });

  getChildrenLinks: (wiki: Hashed<WikiNode>) => string[] = (wiki: Hashed<WikiNode>): string[] => wiki.object.pages;

  getLinks: (wiki: Hashed<WikiNode>) => Promise<string[]> = async (wiki: Hashed<WikiNode>) => this.getChildrenLinks(wiki);

  getLenses = (wiki: Hashed<WikiNode>): Lens[] => {
    return [
      {
        name: 'Wiki',
        render: (lensContent: TemplateResult) => html`
          <basic-wiki .data=${wiki.object}>${lensContent}</basic-wiki>
        `
      }
    ];
  };

  getActions = (WikiNode: Hashed<WikiNode>, entityId: string): PatternAction[] => {
    // const state = this.store.getState();
    // const writable = selectEntityAccessControl(entityId)(selectAccessControl(state));
    // if (!writable) return [];
    return [
      {
        icon: 'title',
        title: 'Create wiki',
        action: (element: HTMLElement) => {
          element.dispatchEvent(
            new CustomEvent('content-changed', {
              bubbles: true,
              composed: true,
              detail: { newContent: { ...WikiNode, type: 'Wiki' } }
            })
          );
        }
      }
    ];
  };

  merge = async (
    originalNode: Hashed<WikiNode>,
    modifications: Hashed<WikiNode>[],
    mergeStrategy: MergeStrategy
  ): Promise<WikiNode> => {
    const resultTitle = mergeStrings(
      originalNode.object.title,
      modifications.map(data => data.object.title)
    );
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map(data => data.object.type)
    );

    const mergedPages = await mergeStrategy.mergeLinks(
      originalNode.object.pages,
      modifications.map(data => data.object.pages)
    );

    return {
      pages: mergedPages,
      title: resultTitle,
      type: resultType
    };
  };
}
