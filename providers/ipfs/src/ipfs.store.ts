import CBOR from 'cbor-js';
import IPFS from 'ipfs';

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
import CID from 'cids';
import { PinnedCacheDB } from './pinner.cache';

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

export class IpfsStore extends Connection implements CASStore {
  logger = new Logger('IpfsStore');
  pinnedCache: PinnedCacheDB;

  casID = 'ipfs';

  constructor(
    public cidConfig: CidConfig = defaultCidConfig,
    protected client?: any,
    protected pinnerUrl?: string,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
    this.pinnedCache = new PinnedCacheDB(`pinned-at-${this.pinnerUrl}`);
  }

  /**
   * @override
   */
  public async connect(ipfsOptions?: IpfsConnectionOptions): Promise<void> {
    if (!this.client) {
      this.client = new IPFS.create();
    }
  }

  public tryPut(buffer: any, putConfig: object, wait: number, attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Try put. Remaining attempts: ${attempt}`, {
        client: this.client,
        buffer,
        putConfig
      });

      let timeout;
      if (attempt > 0) {
        /** retry recursively with twice as much the wait time setting */
        timeout = setTimeout(() => {
          this.tryPut(buffer, putConfig, wait * 2, attempt - 1)
            .then((result: any) => resolve(result))
            .catch(e => reject(e));
        }, wait);
      }

      this.client.dag
        .put(Buffer.from(buffer), putConfig)
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

    if (CID.isCID(hash)) {
      throw new Error(`Invalid CID ${hash}`);
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`Trying to get ${hash}. Remaining attempts: ${attempt}`);

      let found = false;

      /** retry recursively with twice as much the wait time setting */
      if (attempt > 0) {
        timeout = setTimeout(() => {
          this.tryGet(hash, wait * 2, attempt - 1)
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
  create(object: object): Promise<string> {
    return this.putIpfs(object);
  }

  private async putIpfs(object: object) {
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    this.logger.log(`Trying to add object:`, { object, sorted, buffer });

    let putConfig: PutConfig = {
      format: this.cidConfig.codec,
      hashAlg: this.cidConfig.type,
      cidVersion: this.cidConfig.version,
      pin: true
    };

    /** recursively try */
    return this.tryPut(buffer, putConfig, 1000, 6)
      .then((result: any) => {
        let hashString = result.toString(this.cidConfig.base);
        this.logger.log(`Object stored`, {
          object,
          sorted,
          buffer,
          hashString
        });
        if (this.pinnerUrl) {
          this.pinnedCache.pinned.get(hashString).then(pinned => {
            if (!pinned) {
              this.logger.log(`pinning`, hashString);
              fetch(`${this.pinnerUrl}/pin_hash?cid=${hashString}`).then(response => {
                this.pinnedCache.pinned.put({ id: hashString });
              });
            }
          });
        }
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
    if (!hash) throw new Error('hash undefined or empty');
    return this.tryGet(hash, 1000, 6)
      .then(raw => {
        const forceBuffer = Uint8Array.from(raw.value);
        let object = CBOR.decode(forceBuffer.buffer);
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
        return object;
      })
      .catch(e => {
        this.logger.warn(`Object with ${hash} not found in IPFS, returning undefined`, e);
        return undefined;
      });
  }
}
