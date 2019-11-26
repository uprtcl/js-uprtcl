import { html } from 'lit-element';
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
  HasLinks
} from '@uprtcl/cortex';
import { selectCanWrite } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { TextNode, TextType, DocumentsTypes } from '../types';
import { Documents } from '../services/documents';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodePattern
  implements Pattern, Creatable<Partial<TextNode>, TextNode>, HasLenses, HasLinks, HasActions {
  constructor(
    @inject(DocumentsTypes.Documents) protected documents: Documents,
    @inject(PatternTypes.Recognizer) protected recognizer: PatternRecognizer,
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<TextNode>,
    @inject(ReduxTypes.Store) protected store: Store
  ) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node: Partial<TextNode> | undefined, upl?: string): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };
    return this.documents.createTextNode(newTextNode, upl);
  };

  replaceChildrenLinks = (node: TextNode, childrenHashes: string[]): TextNode => ({
    ...node,
    links: childrenHashes
  });

  getHardLinks: (node: TextNode) => string[] = (node: TextNode): string[] => node.links;

  getSoftLinks: (node: TextNode) => Promise<string[]> = async (node: TextNode) => [];

  getLinks: (node: TextNode) => Promise<string[]> = (node: TextNode) =>
    this.getSoftLinks(node).then(links => links.concat(this.getHardLinks(node)));

  getLenses = (node: TextNode): Lens[] => {
    return [
      {
        name: 'Document',
        render: html`
          <text-node .data=${node}></text-node>
        `
      }
    ];
  };

  getActions = (textNode: TextNode, entityId: string): PatternAction[] => {
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
}
