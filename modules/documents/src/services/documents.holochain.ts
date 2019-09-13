import { HolochainConnection, HolochainConnectionOptions } from '@uprtcl/connections';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';

export class DocumentsHolochain implements DocumentsProvider {
  documentsZome: HolochainConnection;
  proxyZome: HolochainConnection;

  constructor(options: HolochainConnectionOptions) {
    this.documentsZome = new HolochainConnection('documents', options);
    this.proxyZome = new HolochainConnection('proxy', options);
  }

  async get<T extends object>(hash: string): Promise<T | undefined> {
    const response = await this.proxyZome.call('get_proxied_entry', {
      address: hash
    });
    const entry = this.documentsZome.parseEntryResult<T>(response);

    if (!entry) return undefined;

    return entry.entry;
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.documentsZome.call('create_text_node', {
      node: node
    });
  }
}
