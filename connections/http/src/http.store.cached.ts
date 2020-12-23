import { CASStore, CidConfig } from '@uprtcl/multiplatform';

import { HttpProvider } from './http.provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { EntitiesCacheDB } from './http.store.cache.db';
import { hashObject } from '@uprtcl/evees';

const store_api = 'store';

export class HttpStoreCached implements CASStore {
  logger = new Logger('Http Store');
  cache: EntitiesCacheDB;

  constructor(
    protected provider: HttpProvider,
    public cidConfig: CidConfig,
    protected interval: number = 10000
  ) {
    this.cache = new EntitiesCacheDB(`entities-cache-${provider.id}`);
  }

  get casID() {
    return `http:${store_api}:${this.provider.pOptions.host}`;
  }

  ready() {
    return Promise.resolve();
  }

  async get(hash: string): Promise<object> {
    const cached = await this.cache.entities.get(hash);
    if (cached) {
      return cached.object;
    }
    return this.provider.getObject<object>(`/get/${hash}`);
  }

  async create(object: object, hash?: string): Promise<string> {
    hash = hash || (await hashObject(object, this.cidConfig));

    const current = await this.cache.entities.get(hash);
    if (!current) {
      await this.cache.entities.put({ id: hash, object, stored: 0 });
    }

    return hash;
  }

  async flush() {
    const unstored = await this.cache.entities
      .where('stored')
      .equals(0)
      .toArray();
    const n = unstored.length;
    if (n === 0) {
      return;
    }

    this.logger.log(`${n} objects not stored`);
    const datas = unstored.map((data) => {
      return {
        id: data.id,
        object: data.object,
      };
    });

    await this.provider.post(`/data`, { datas });

    await this.cache.entities.where('stored').equals(0).modify({ stored: 1 });
  }
}
