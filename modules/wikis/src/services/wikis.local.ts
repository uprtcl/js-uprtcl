import { inject, injectable } from 'inversify';
import { Hashed, DiscoveryTypes, CacheService, CortexTypes, Hashable } from '@uprtcl/cortex';
import { WikisProvider } from './wikis.provider';
import { WikiNode } from '../types';

@injectable()
export class WikisLocal implements WikisProvider {
  constructor(
    @inject(CortexTypes.Core.Hashed)
    protected hashedPattern: Hashable<any>,
    @inject(DiscoveryTypes.Cache)
    protected objectsCache: CacheService
  ) {}

  async createWikiNode(node: WikiNode): Promise<string> {
    const hashed = await this.hashedPattern.derive()(node);

    await this.objectsCache.cache(hashed.id, hashed);

    return hashed.id;
  }

  async ready(): Promise<void> {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get<T>(hash);
  }
}
