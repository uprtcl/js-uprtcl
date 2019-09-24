import { HolochainConnection, HolochainConnectionOptions } from '@uprtcl/connections';
import { ProxyProvider } from '@uprtcl/common';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';
import { Hashed } from '@uprtcl/cortex';

export class DocumentsHolochain implements DocumentsProvider {
  documentsZome: HolochainConnection;
  proxyProvider: ProxyProvider;

  constructor(options: HolochainConnectionOptions) {
    this.documentsZome = new HolochainConnection('documents', options);
    this.proxyProvider = new ProxyProvider(options);
  }

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.proxyProvider.get(hash);
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.documentsZome.call('create_text_node', {
      node: node
    });
  }
}
