import { HolochainConnectionOptions, HolochainSource } from '@uprtcl/connections';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';
import { ConnectionOptions } from '@uprtcl/connections/dist/types/connections/connection';

export class DocumentsHolochain extends HolochainSource implements DocumentsProvider {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    super('documents', hcOptions, options);
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.call('create_text_node', {
      node: node
    });
  }
}
