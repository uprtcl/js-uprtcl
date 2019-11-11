import {
  HolochainSource,
  HolochainConnection
} from '@uprtcl/connections';
import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';

export class DocumentsHolochain extends HolochainSource implements DocumentsProvider {
  constructor(instance: string, hcConnection: HolochainConnection) {
    super({ instance, zome: 'documents' }, hcConnection);
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.call('create_text_node', {
      node: node
    });
  }
}
