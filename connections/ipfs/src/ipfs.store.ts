import CBOR from 'cbor-js';
import IPFS from 'ipfs';

import {
  CidConfig,
  defaultCidConfig,
  CASStore,
  Connection,
  ConnectionOptions,
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { IpfsConnectionOptions } from './types';
import { sortObject } from './utils';
import { PinnerCached } from './pinner';

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

const TIMEOUT = 10000;
const ENABLE_LOG = true;

const promiseWithTimeout = (
  promise: Promise<any>,
  timeout: number
): Promise<any> => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

export class IpfsStore extends Connection implements CASStore {
  logger = new Logger('IpfsStore');

  casID = 'ipfs';

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

  /**
   * Adds a raw js object to IPFS with the given cid configuration
   */
  create(object: object): Promise<string> {
    return this.putIpfs(object);
  }

  private async putIpfs(object: object) {
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    if (ENABLE_LOG) {
      this.logger.log(`Trying to add object:`, { object, sorted, buffer });
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
      this.logger.log(`Object stored`, {
        object,
        sorted,
        buffer,
        hashString,
      });
    }

    if (this.pinner) this.pinner.pin(hashString);

    return hashString;
  }

  /**
   * Retrieves the object with the given hash from IPFS
   */
  async get(hash: string): Promise<object | undefined> {
    /** recursively try */
    if (!hash) throw new Error('hash undefined or empty');

    try {
      const raw = await promiseWithTimeout(this.client.dag.get(hash), 10000);
      const forceBuffer = Uint8Array.from(raw.value);
      let object = CBOR.decode(forceBuffer.buffer);
      if (ENABLE_LOG) {
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
      }
      return object;
    } catch (e) {
      throw new Error(`Error reading ${hash}`);
    }
  }
}
