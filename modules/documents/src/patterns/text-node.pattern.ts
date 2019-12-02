import { injectable, inject } from 'inversify';

import {
  Pattern,
  Hashed,
  Creatable
} from '@uprtcl/cortex';

import { TextNode, TextType, DocumentsTypes } from '../types';
import { Documents } from '../services/documents';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodePattern implements Pattern, Creatable<Partial<TextNode>, TextNode> {
  constructor(@inject(DocumentsTypes.Documents) protected documents: Documents) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node: Partial<TextNode> | undefined, upl?: string): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    if (!upl) {
      upl = this.documents.service.remote.getAllServicesUpl().find(upl => !upl.includes('http'));
    }

    const newTextNode = { links, text, type };
    return this.documents.createTextNode(newTextNode, upl);
  };
}
