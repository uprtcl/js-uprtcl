import {
  Pattern,
  LensesPattern,
  ActionsPattern,
  PatternAction,
  Lens,
  Hashed,
  HashedPattern,
  PatternTypes,
  CreatePattern,
  NamedSource,
  DiscoverableSource
} from '@uprtcl/cortex';
import { TextNode, TextType, DocumentsTypes } from '../types';
import { DocumentsProvider } from '../services/documents.provider';
import { injectable, inject } from 'inversify';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodePattern
  implements Pattern, CreatePattern<Partial<TextNode>, TextNode>, LensesPattern, ActionsPattern {
  constructor(
    @inject(DocumentsTypes.DocumentsProvider)
    protected documentsProvider: DiscoverableSource<DocumentsProvider & NamedSource>,
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & HashedPattern<TextNode>
  ) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node?: Partial<TextNode>): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };

    const hash = await this.documentsProvider.source.createTextNode(newTextNode);

    return {
      id: hash,
      object: newTextNode
    };
  };

  getLenses = (): Lens[] => {
    return [
      {
        lens: 'text-node',
        params: {}
      }
    ];
  };

  getActions = (textNode: TextNode): PatternAction[] => {
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
