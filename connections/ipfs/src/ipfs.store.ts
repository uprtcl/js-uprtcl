import CBOR from 'cbor-js';
import IPFS from 'ipfs';

import {
  CidConfig,
  Connection,
  ConnectionOptions,
  sortObject,
  Logger,
  Entity,
  EntityGetResult,
  CASRemote,
  hashObject,
} from '@uprtcl/evees';

import { IpfsConnectionOptions, PinnerConfig } from './types';
import { PinnedCacheDB } from './pinner.cache';

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

export const defaultCidConfig: CidConfig = {
  version: 1,
  type: 'sha2-256',
  codec: 'raw',
  base: 'base58btc',
};

const TIMEOUT = 10000;
const ENABLE_LOG = true;

const promiseWithTimeout = (promise: Promise<any>, timeout: number): Promise<any> => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

export class IpfsStore extends Connection implements CASRemote {
  logger = new Logger('IpfsStore');
  pinnedCache?: PinnedCacheDB;

  casID = 'ipfs';

  constructor(
    public cidConfig: CidConfig = defaultCidConfig,
    protected client?: any,
    protected pinnerConfig?: PinnerConfig,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
    this.pinnedCache = this.pinnerConfig
      ? new PinnedCacheDB(`pinned-at-${this.pinnerConfig.url}`)
      : undefined;
  }

  /**
   * @override
   */
  public async connect(ipfsOptions?: IpfsConnectionOptions): Promise<void> {
    if (!this.client) {
      this.client = new IPFS.create();
    }
  }

  private async putIpfs(object: object): Promise<Entity<any>> {
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    if (ENABLE_LOG) {
      this.logger.log('Trying to add object:', { object, sorted, buffer });
    }

    let putConfig: PutConfig = {
      format: this.cidConfig.codec,
      hashAlg: this.cidConfig.type,
      cidVersion: this.cidConfig.version,
      pin: true,
    };

    /** recursively try */
    const result = await this.client.dag.put(Buffer.from(buffer), putConfig);
    let hashString = result.toString(this.cidConfig.base);

    if (ENABLE_LOG) {
      this.logger.log('Object stored', {
        object,
        sorted,
        buffer,
        hashString,
      });
    }
    if (this.pinnedCache) {
      const config = this.pinnerConfig as PinnerConfig;
      const cache = this.pinnedCache as PinnedCacheDB;

      this.pinnedCache.pinned.get(hashString).then((pinned) => {
        if (!pinned) {
          if (ENABLE_LOG) {
            this.logger.log(`pinning`, hashString);
          }
          fetch(`${config.url}/pin_hash?cid=${hashString}`).then((response) => {
            cache.pinned.put({ id: hashString });
          });
        }
      });
    }
    return {
      id: hashString,
      object,
    };
  }

  /**
   * Retrieves the object with the given hash from IPFS
   */
  async get(hash: string): Promise<Entity<any>> {
    /** recursively try */
    if (!hash) throw new Error('hash undefined or empty');

    try {
      const raw = await promiseWithTimeout(this.client.dag.get(hash), 10000);
      const forceBuffer = Uint8Array.from(raw.value);
      let object = CBOR.decode(forceBuffer.buffer);
      if (ENABLE_LOG) {
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
      }
      return { id: hash, object };
    } catch (e) {
      throw new Error(`Error reading ${hash}`);
    }
  }

  async hash(object: object) {
    /** optimistically hash based on the CidConfig without asking the server */
    const id = await hashObject(object, this.cidConfig);
    return {
      id,
      object,
    };
  }

  async cacheEntities(entities: Entity<any>[]): Promise<void> {}

  storeEntities(objects: any[]): Promise<Entity<any>[]> {
    throw new Error('Use storeObjects on CASRemotes');
  }
  storeObjects(objects: object[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((object) => this.putIpfs(object)));
  }
  hashEntities(objects: any[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((object) => this.hash(object.object)));
  }
  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    return { entities };
  }

  async flush(): Promise<void> {}

  async getEntity(hash: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([hash]);
    return entities[0];
  }
  async storeEntity(object: any): Promise<string> {
    const entities = await this.storeEntities([object]);
    return entities[0].id;
  }
  async hashEntity<T = any>(object: any): Promise<Entity<T>> {
    const entities = await this.hashEntities([object]);
    return entities[0];
  }
}
