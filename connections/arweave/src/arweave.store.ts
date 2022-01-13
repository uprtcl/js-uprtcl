import CBOR from 'cbor-js';
import Arweave from 'arweave-js';

import {
  CidConfig,
  Connection,
  ConnectionOptions,
  sortObject,
  Logger,
  Entity,
  EntityRemote,
  hashObject,
  EntityCreate,
  validateEntities,
  cidConfigOf,
  defaultCidConfig,
} from '@uprtcl/evees';

import { ArweaveConnectionOptions } from './types';

const LOGINFO = false;

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

const promiseWithTimeout = (promise: Promise<any>, timeout: number): Promise<any> => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

export class ArweaveStore extends Connection implements EntityRemote {
  logger = new Logger('ArweaveStore');

  casID = 'arweave';
  readonly isLocal = false;

  constructor(
    public cidConfig: CidConfig = defaultCidConfig,
    protected arweave?: Aer,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
  }

  /**
   * @override
   */
  public async connect(options: ArweaveConnectionOptions = {
    host: "arweave.net",
    port: 443,
    protocol: "https",
  }): Promise<void> {
    if (!this.arweave) {
      this.arweave = Arweave.init(options);
    }
  }

  /** Get a set of entities (with hashed already computed and trusted), bundles all of them into a single object, serializes and stores it. */
  private async storeEntities(entities: Entity[]): Promise<Entity> {
    
    const bundle: any = {};

    entities.map(entity => bundle[entity.hash] = entity.object);

    const data = CBOR.encode(entities);

    if (LOGINFO) {
      this.logger.log('Trying to add object:', { entities });
    }

    let transaction = await this.arweave.createTransaction({
      data,
    });

    if (LOGINFO) {
      this.logger.log('Object stored', {
        transaction,
      });
    }

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
      if (LOGINFO) {
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
      }
      return { hash, object, remote: this.casID };
    } catch (e) {
      throw new Error(`Error reading ${hash}`);
    }
  }

  async hash(entityCreate: EntityCreate): Promise<Entity> {
    const cidConfig = entityCreate.hash ? cidConfigOf(entityCreate.hash) : this.cidConfig;

    /** optimistically hash based on the CidConfig without asking the server */
    const hash = await hashObject(entityCreate.object, cidConfig);

    const entity = {
      hash,
      object: entityCreate.object,
      remote: this.casID,
    };

    if (LOGINFO) this.logger.log('hash', { entity, cidConfig });

    return entity;
  }

  async getEntities(hashes: string[]): Promise<Entity[]> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    return entities;
  }

  async flush(): Promise<void> {}

  async diff(): Promise<Entity<any>[]> {
    return [];
  }

  async getEntity(hash: string): Promise<Entity> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  async persistEntities(entities: Entity[]): Promise<void> {
    const entitiesStored = await Promise.all(
      entities.map((entity) => {
        const cidConfig = entity.hash ? cidConfigOf(entity.hash) : this.cidConfig;
        return this.putIpfs(entity.object, cidConfig);
      })
    );

    validateEntities(entitiesStored, entities);
  }

  async persistEntity(entity: Entity<any>): Promise<void> {
    return this.persistEntities([entity]);
  }

  hashObjects(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((entity) => this.hash(entity)));
  }

  async hashObject<T = any>(object: any): Promise<Entity<T>> {
    const entities = await this.hashObjects([object]);
    return entities[0];
  }

  async removeEntities(hashes: string[]): Promise<void> {
    console.warn('Ipfs cant delete entities');
  }
}
