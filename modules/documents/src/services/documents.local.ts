import { inject } from 'inversify';
import { Hashed, DiscoveryTypes, CacheService } from '@uprtcl/cortex';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';

export class DocumentsLocal implements DocumentsProvider {
  name: string = 'documents-local';

  constructor(
    @inject(DiscoveryTypes.Cache)
    protected objectsCache: CacheService
  ) {}

  async createTextNode(node: TextNode): Promise<string> {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(node)); // encode as (utf-8) Uint8Array
    const hash = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hash)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string

    await this.objectsCache.cache(hashHex, node);

    return hashHex;
  }

  async ready(): Promise<void> {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get<T>(hash);
  }
}
