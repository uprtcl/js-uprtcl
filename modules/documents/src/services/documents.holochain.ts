import { HolochainConnection, HolochainConnectionOptions, HolochainSource } from '@uprtcl/connections';
import { ProxyProvider } from '@uprtcl/common';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';
import { Hashed, NamedSource } from '@uprtcl/cortex';

export class DocumentsHolochain implements DocumentsProvider {
  documentsSource: HolochainSource;
  proxyProvider: ProxyProvider;

  constructor(options: HolochainConnectionOptions) {
    this.documentsSource = new HolochainSource('documents', options);
    this.proxyProvider = new ProxyProvider(options);
  }

  get name() {
    return this.documentsSource.name;
  }

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.proxyProvider.get(hash);
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.documentsSource.call('create_text_node', {
      node: node
    });
  }
}
