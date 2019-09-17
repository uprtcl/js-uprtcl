import {
  Pattern,
  CreatePattern,
  LensesPattern,
  MenuPattern,
  Lens,
  MenuItem,
  Hashed
} from '@uprtcl/cortex';
import { TextNode, TextType } from '../types';
import { DocumentsProvider } from '../services/documents.provider';

export class TextNodePattern
  implements Pattern, CreatePattern<[], TextNode>, LensesPattern, MenuPattern {
  constructor(protected documentsProvider: DocumentsProvider) {}

  recognize(object: object): boolean {
    return (
      object.hasOwnProperty('text') &&
      object.hasOwnProperty('type') &&
      object.hasOwnProperty('links')
    );
  }

  create = async (): Promise<Hashed<TextNode>> => {
    const newTextNode: TextNode = {
      links: [],
      text: '',
      type: TextType.Paragraph
    };

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

  getMenuItems = (): MenuItem[] => {
    return [
      {
        icon: '',
        title: 'To paragraph',
        action: () => {}
      }
    ];
  };
}
