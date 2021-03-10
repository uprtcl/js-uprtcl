import { Logger } from '@uprtcl/evees';
import { EntityStatus, PinnerCacheDB } from './pinner.cached.db';

export class PinnerCached {
  logger: Logger = new Logger('Pinner Cached');
  cache: PinnerCacheDB;
  isFlusshing = false;

  constructor(protected url: string, flushInterval: number = 1000) {
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

    const unpinnedHashes = await unpinned
      .clone()
      .and((o: EntityStatus) => !o.id.startsWith('/orbitdb/'))
      .primaryKeys();

    const unpinnedDBs = await unpinned
      .clone()
      .and((o) => o.id.startsWith('/orbitdb/'))
      .primaryKeys();

    if (unpinnedHashes.length > 0) {
      this.logger.log('pinning entities', unpinnedHashes);
      await fetch(`${this.url}/pin_hash`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ cids: unpinnedHashes }),
      });
      this.logger.log('pinning entities - done');
    }

    if (unpinnedDBs.length > 0) {
      this.logger.log('pinning addresses', unpinnedDBs);
      await fetch(`${this.url}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ addresses: unpinnedDBs }),
      });
      this.logger.log('pinning addresses - done');
    }

    /** marge unpinned as pinned */
    await Promise.all(
      unpinnedHashes.concat(unpinnedDBs).map(async (id) => {
        // TODO mark all with a dexie tx
        await this.cache.entities.put({
          id: id,
          pinned: 1,
        });
      })
    );

    this.isFlusshing = false;
  }
}
