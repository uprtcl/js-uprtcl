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

const propertyOrder = ['text', 'type', 'links'];

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

  replaceChildrenLinks = (wiki: WikiNode, childrenHashes: string[]): WikiNode => ({
    ...wiki,
    pages: childrenHashes
  });

  getHardLinks: (wiki: WikiNode) => string[] = (wiki: WikiNode): string[] => wiki.pages;

  getSoftLinks: (wiki: WikiNode) => Promise<string[]> = async (wiki: WikiNode) => [];

  getLinks: (wiki: WikiNode) => Promise<string[]> = (wiki: WikiNode) =>
    this.getSoftLinks(wiki).then(pages => pages.concat(this.getHardLinks(wiki)));

  getLenses = (node: WikiNode): Lens[] => {
    return [
      {
        name: 'Wiki',
        render: html`
          <basic-wiki .data=${node}></basic-wiki>
        `
      }
    ];
  };

  getActions = (WikiNode: WikiNode, entityId: string): PatternAction[] => {
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

  // merge = async (
  //   originalNode: Hashed<WikiNode>,
  //   modifications: Hashed<WikiNode>[],
  //   mergeStrategy: MergeStrategy
  // ): Promise<WikiNode> => {
  //   const resultText = mergeStrings(
  //     originalNode.object.text,
  //     modifications.map(data => data.object.text)
  //   );
  //   const resultType = mergeResult(
  //     originalNode.object.type,
  //     modifications.map(data => data.object.type)
  //   );

  //   const mergedLinks = await mergeStrategy.mergeLinks(
  //     originalNode.object.links,
  //     modifications.map(data => data.object.links)
  //   );

  //   return {
  //     links: mergedLinks,
  //     text: resultText,
  //     type: resultType
  //   };
  // };
}
