import { HolochainSource, HolochainConnection } from '@uprtcl/connections';
import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';

export class DocumentsHolochain extends HolochainSource implements DocumentsProvider {
  constructor(instance: string, hcConnection: HolochainConnection) {
    super({ instance, zome: 'documents' }, hcConnection);
  }

  createTextNode(node: TextNode, hash?: string): Promise<string> {
    return this.call('create_text_node', {
      previous_address: hash,
      node: node
    });
  }
}
