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
  EntityCreate,
  validateEntities,
} from '@uprtcl/evees';

import { IpfsConnectionOptions } from './types';
import { PinnerCached } from './pinner.cached';

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

  casID = 'ipfs';
  readonly isLocal = false;

  constructor(
    public cidConfig: CidConfig = defaultCidConfig,
    protected client?: any,
    protected pinner?: PinnerCached,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
  }

  /**
   * @override
   */
  public async connect(ipfsOptions?: IpfsConnectionOptions): Promise<void> {
    if (!this.client) {
      this.client = new IPFS.create();
    }
  }

  private async putIpfs(object: object): Promise<Entity> {
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

    if (this.pinner) this.pinner.pin(hashString);

    return {
      id: hashString,
      object,
      casID: this.casID,
    };
  }

  /**
   * Retrieves the object with the given hash from IPFS
   */
  async get(hash: string): Promise<Entity> {
    /** recursively try */
    if (!hash) throw new Error('hash undefined or empty');

    try {
      const raw = await promiseWithTimeout(this.client.dag.get(hash), 10000);
      const forceBuffer = Uint8Array.from(raw.value);
      let object = CBOR.decode(forceBuffer.buffer);
      if (ENABLE_LOG) {
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
      }
      return { id: hash, object, casID: this.casID };
    } catch (e) {
      throw new Error(`Error reading ${hash}`);
    }
  }

  async hash(entity: EntityCreate): Promise<Entity> {
    /** optimistically hash based on the CidConfig without asking the server */
    const id = await hashObject(entity.object, this.cidConfig);
    return {
      id,
      object: entity.object,
      casID: this.casID,
    };
  }

  async cacheEntities(entities: Entity[]): Promise<void> {}

  async storeEntities(entitiesCreate: EntityCreate[]): Promise<Entity[]> {
    const entities = await Promise.all(entitiesCreate.map((entity) => this.putIpfs(entity.object)));

    validateEntities(entities, entitiesCreate);

    return entities;
  }
  hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((entity) => this.hash(entity)));
  }
  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    return { entities };
  }

  async flush(): Promise<void> {}

  async diff(): Promise<Entity<any>[]> {
    return [];
  }

  async getEntity(hash: string): Promise<Entity> {
    const { entities } = await this.getEntities([hash]);
    return entities[0];
  }
  async storeEntity(entity: Entity): Promise<Entity> {
    const entities = await this.storeEntities([entity]);
    return entities[0];
  }
  async hashEntity<T = any>(object: any): Promise<Entity<T>> {
    const entities = await this.hashEntities([object]);
    return entities[0];
  }
}
