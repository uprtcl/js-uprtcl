import { inject } from 'inversify';
import { Hashed, DiscoveryTypes, CacheService, PatternTypes, HashedPattern } from '@uprtcl/cortex';
import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';

export class DocumentsLocal implements DocumentsProvider {
  constructor(
    @inject(PatternTypes.Core.Hashed)
    protected hashedPattern: HashedPattern<any>,
    @inject(DiscoveryTypes.Cache)
    protected objectsCache: CacheService
  ) {}

  async createTextNode(node: TextNode): Promise<string> {
    const hashed = await this.hashedPattern.derive(node);

    await this.objectsCache.cache(hashed.id, node);

    return hashed.id;
  }

  async ready(): Promise<void> {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get<T>(hash);
  }
}
