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
  Creatable,
  PatternRecognizer,
  HasChildren
} from '@uprtcl/cortex';
import { Mergeable, MergeStrategy } from '@uprtcl/evees';
import { selectCanWrite } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';
import { mergeStrings, mergeResult } from '@uprtcl/evees';

import { TextNode, TextType, DocumentsTypes } from '../types';
import { Documents } from '../services/documents';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodeEntity implements Pattern, HasLenses, HasChildren, HasActions, Mergeable {
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

  replaceChildrenLinks = (node: Hashed<TextNode>, childrenHashes: string[]): Hashed<TextNode> => ({
    ...node,
    object: {
      ...node.object,
      links: childrenHashes
    }
  });

  getChildrenLinks: (node: Hashed<TextNode>) => string[] = (node: Hashed<TextNode>): string[] =>
    node.object.links;

  getLinks: (node: Hashed<TextNode>) => Promise<string[]> = async (node: Hashed<TextNode>) =>
    this.getChildrenLinks(node);

  getLenses = (node: Hashed<TextNode>): Lens[] => {
    return [
      {
        name: 'Document',
        render: (lensContent: TemplateResult) => html`
          <text-node .data=${node.object}>${lensContent}</text-node>
        `
      }
    ];
  };

  getActions = (node: Hashed<TextNode>, entityId: string): PatternAction[] => {
    const textNode = node.object;
    const state = this.store.getState();
    const writable = selectCanWrite(this.recognizer)(entityId)(state);

    if (!writable) return [];

    if (textNode.type === TextType.Paragraph) {
      return [
        {
          icon: 'title',
          title: 'To title',
          action: (element: HTMLElement) => {
            element.dispatchEvent(
              new CustomEvent('content-changed', {
                bubbles: true,
                composed: true,
                detail: { newContent: { ...textNode, type: TextType.Title } }
              })
            );
          }
        }
      ];
    } else {
      return [
        {
          icon: 'text_fields',
          title: 'To paragraph',
          action: (element: HTMLElement) => {
            element.dispatchEvent(
              new CustomEvent('content-changed', {
                bubbles: true,
                composed: true,
                detail: { newContent: { ...textNode, type: TextType.Paragraph } }
              })
            );
          }
        }
      ];
    }
  };

  merge = async (
    originalNode: Hashed<TextNode>,
    modifications: Hashed<TextNode>[],
    mergeStrategy: MergeStrategy
  ): Promise<TextNode> => {
    const resultText = mergeStrings(
      originalNode.object.text,
      modifications.map(data => data.object.text)
    );
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map(data => data.object.type)
    );

    const mergedLinks = await mergeStrategy.mergeLinks(
      originalNode.object.links,
      modifications.map(data => data.object.links)
    );

    return {
      links: mergedLinks,
      text: resultText,
      type: resultType
    };
  };
}
