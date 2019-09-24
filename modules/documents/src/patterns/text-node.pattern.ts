import {
  Pattern,
  CreatePattern,
  LensesPattern,
  ActionsPattern,
  PatternAction,
  Lens,
  Hashed,
  HashedPattern
} from '@uprtcl/cortex';
import { TextNode, TextType } from '../types';
import { DocumentsProvider } from '../services/documents.provider';

const propertyOrder = ['text', 'type', 'links'];

export class TextNodePattern
  implements Pattern, CreatePattern<Partial<TextNode>, TextNode>, LensesPattern, ActionsPattern {
  constructor(
    protected documentsProvider: DocumentsProvider,
    protected hashedPattern: Pattern & HashedPattern<TextNode>
  ) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node?: Partial<TextNode>): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };

    const hash = await this.documentsProvider.createTextNode(newTextNode);

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

  getActions = (): PatternAction[] => {
    return [
      {
        icon: '',
        title: 'To paragraph',
        action: () => {}
      }
    ];
  };
}
