import { html } from 'lit-element';
import { injectable, inject } from 'inversify';

import {
  Pattern,
  HasLenses,
  HasActions,
  PatternAction,
  Lens,
  Hashed,
  Hashable,
  PatternTypes,
  Creatable,
  NamedSource,
  DiscoverableSource,
  PatternRecognizer,
  Updatable
} from '@uprtcl/cortex';

import { TextNode, TextType, DocumentsTypes } from '../types';
import { DocumentsProvider } from '../services/documents.provider';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodePattern
  implements Pattern, Creatable<Partial<TextNode>, TextNode>, HasLenses, HasActions {
  constructor(
    @inject(PatternTypes.Recognizer)
    protected recognizer: PatternRecognizer,
    @inject(DocumentsTypes.DocumentsProvider)
    protected documentsProvider: DiscoverableSource<DocumentsProvider & NamedSource>,
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<TextNode>
  ) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node?: Partial<TextNode>): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };

    const hash = await this.documentsProvider.service.createTextNode(newTextNode);

    return {
      id: hash,
      object: newTextNode
    };
  };

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

  getActions = (textNode: TextNode, entity: any): PatternAction[] => {
    const updatable: Updatable = this.recognizer.recognizeMerge(entity);

    if (updatable.canUpdate && !updatable.canUpdate(entity)) return [];

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
