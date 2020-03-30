import CBOR from 'cbor-js';
import CID from 'cids';
import multihashing from 'multihashing-async';
import ipfsClient, { Buffer } from 'ipfs-http-client';

import {
  CidConfig,
  defaultCidConfig,
  CASStore,
  Connection,
  ConnectionOptions
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { IpfsConnectionOptions } from './types';
import { sortObject } from './utils';

export class IpfsStore extends Connection implements CASStore {
  logger = new Logger('IpfsSource');
  client: any;

  casID = 'ipfs';

  constructor(
    protected ipfsOptions: IpfsConnectionOptions,
    public cidConfig: CidConfig = defaultCidConfig,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.client = ipfsClient(this.ipfsOptions);
  }

  public tryPut(buffer: Buffer, putConfig: object, wait: number, attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Try put. Attempt: ${attempt}`, { client: this.client, buffer, putConfig });

      let timeout;
      if (attempt < 4) {
        /** retry recursively with twice as much the wait time setting */
        timeout = setTimeout(() => {
          this.tryPut(buffer, putConfig, wait * 2, attempt + 1)
            .then((result: any) => resolve(result))
            .catch(e => reject(e));
        }, wait);
      }

      this.client.dag
        .put(buffer, putConfig)
        .then((result: object) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(e => {
          this.logger.error(`Error putting object on IPFS on attempt: ${attempt}`, {
            e,
            client: this.client,
            buffer,
            putConfig
          });
        });
    });
  }

  public tryGet(hash: string, wait: number, attempt: number): Promise<any> {
    let timeout;

    return new Promise((resolve, reject) => {
      this.logger.log(`Trying to get ${hash}. Attempt: ${attempt}`);

      let found = false;

      /** retry recursively with twice as much the wait time setting */
      if (attempt < 1) {
        timeout = setTimeout(() => {
          this.tryGet(hash, wait * 2, attempt + 1)
            .then(result => resolve(result))
            .catch(e => {
              if (!found) reject(e);
            });
        }, wait);
      }

      this.client.dag.get(hash).then((result: any) => {
        found = true;
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  /**
   * Adds a raw js object to IPFS with the given cid configuration
   */
  create(object: object, hash?: string): Promise<string> {
    const cidConfig = this.cidConfig;
    if (hash) {
      const cid = new CID(hash);
      const mh = multihashing.multihash.decode(cid.multihash);
      cidConfig.type = mh.name;
    }

    return this.putIpfs(object, cidConfig);
  }

  private async putIpfs(object: object, cidConfig: CidConfig) {
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    this.logger.log(`Trying to add object:`, { object, sorted, buffer });

    /** recursively try */
    return this.tryPut(buffer, cidConfig, 500, 0)
      .then((result: any) => {
        let hashString = result.toString(cidConfig.base || this.cidConfig.base);
        this.logger.log(`Object stored`, { object, sorted, buffer, hashString });
        return hashString;
      })
      .catch(e => {
        this.logger.error('error', e);
        throw new Error('Sorry but it seems impossible to store this on IPFS');
      });
  }

  /**
   * Retrieves the object with the given hash from IPFS
   */
  async get(hash: string): Promise<object | undefined> {
    /** recursively try */
    return this.tryGet(hash, 500, 0)
      .then(raw => {
        let object = CBOR.decode(raw.value.buffer);
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
        return object;
      })
      .catch(e => {
        this.logger.warn(`Object with ${hash} not found in IPFS, returning undefined`, e);
        return undefined;
      });
  }
}
