import { inject, injectable } from 'inversify';

import { Hashed, Hashable } from '@uprtcl/cortex';
import { CacheService } from '@uprtcl/multiplatform';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { CorePatterns } from '@uprtcl/common';

import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';

@injectable()
export class DocumentsLocal implements DocumentsProvider {
  constructor(
    @inject(CorePatterns.Hashed)
    protected hashedPattern: Hashable<any>,
    @inject(DiscoveryModule.types.Cache)
    protected objectsCache: CacheService
  ) {}

  async createTextNode(node: TextNode): Promise<string> {
    const hashed = await this.hashedPattern.derive()(node);

    await this.objectsCache.cache(hashed.id, hashed);

    return hashed.id;
  }

  async ready(): Promise<void> {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get<T>(hash);
  }
}
