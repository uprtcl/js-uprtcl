import { Logger } from '@uprtcl/micro-orchestrator';
import { EntityStatus, PinnerCacheDB } from './pinner.cache.db';

export class PinnerCached {
  logger: Logger = new Logger('Pinner Cached');
  cache: PinnerCacheDB;
  isFlusshing: boolean = false;

  constructor(protected url: string, flushInterval: number) {
    this.cache = new PinnerCacheDB(`pinner-cache-${url}`);
    setInterval(() => this.flush(), flushInterval);
  }

  async pin(hash: string) {
    const current = await this.cache.entities.get(hash);
    if (!current) {
      await this.cache.entities.put({ id: hash, pinned: 0 });
    }
  }

  public async isPinned(address: string) {
    const result = await fetch(`${this.url}/includes?address=${address}`, {
      method: 'GET',
    });

    const { includes } = await result.json();
    return includes;
  }

  public async getAll(address: string) {
    if (this.url) {
      const addr = address.toString();

      const result = await fetch(`${this.url}/getAll?address=${addr}`, {
        method: 'GET',
      });

      return result.json();
    }
  }

  public async getEntity(hash: string) {
    const addr = hash.toString();

    const result = await fetch(`${this.url}/getEntity?cid=${addr}`, {
      method: 'GET',
    });

    return result.json();
  }

  async flush() {
    if (!this.cache) throw new Error('cache not initialized');
    if (this.isFlusshing) return;

    this.isFlusshing = true;

    const unpinned = this.cache.entities.where('pinned').equals(0);
    const n = await unpinned.count();
    if (n > 0) {
      this.logger.log(`${n} objects not pinned pinned`);
    }

    const unpinnedHashed = await unpinned
      .clone()
      .and((o: EntityStatus) => !o.id.startsWith('/orbitdb/'))
      .toArray();
    const unpinnedDB = await unpinned
      .clone()
      .and((o) => o.id.startsWith('/orbitdb/'))
      .toArray();

    if (unpinnedHashed.length > 0) {
      this.logger.log('pinning entities', unpinnedHashed);
      await fetch(`${this.url}/pin_hash`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ cids: unpinnedHashed.map((e) => e.id) }),
      });
      this.logger.log('pinning entities - done');
    }
    if (unpinnedDB.length > 0) {
      this.logger.log('pinning addresses', unpinnedDB);
      await fetch(`${this.url}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ addresses: unpinnedDB.map((e) => e.id) }),
      });
      this.logger.log('pinning addresses - done');
    }

    const nPinned = await this.cache.entities
      .where('pinned')
      .equals(0)
      .modify({ pinned: 1 });

    if (nPinned > 0) {
      this.logger.log('marked as pinned', nPinned);
    }
    if (n !== nPinned) {
      throw new Error(`Error marked the pinned objects as pinned`);
    }

    this.isFlusshing = false;
  }
}
