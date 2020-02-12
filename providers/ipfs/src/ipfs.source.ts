import CBOR from 'cbor-js';

import { Hashed } from '@uprtcl/cortex';
import { Source } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { CidConfig, defaultCidConfig } from './cid.config';
import { IpfsConnection } from './ipfs.connection';

export function sortObject(object: object): object {
  if (typeof object !== 'object' || object instanceof Array) {
    // Not to sort the array
    return object;
  }
  const keys = Object.keys(object).sort();

  const newObject = {};
  for (let i = 0; i < keys.length; i++) {
    newObject[keys[i]] = sortObject(object[keys[i]]);
  }
  return newObject;
}

export class IpfsSource implements Source {
  logger = new Logger('IpfsSource');
  
  source = 'ipfs';
  hashRecipe: CidConfig;

  constructor(protected ipfsConnection: IpfsConnection, hashRecipe: CidConfig) {
    this.hashRecipe = hashRecipe;
  }


  /**
   * @override
   */
  ready() {
    return this.ipfsConnection.ready();
  }

  /**
   * Adds a raw js object to IPFS with the given cid configuration
   */
  public async addObject(object: object): Promise<string> {
    let putConfig = {
      format: this.hashRecipe.codec,
      hashAlg: this.hashRecipe.type,
      cidVersion: this.hashRecipe.version
    };

    
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    this.logger.log(`Trying to add object:`, {object, sorted, buffer});

    /** recursively try */
    return this.ipfsConnection
      .tryPut(buffer, putConfig, 500, 0)
      .then((result: any) => {
        let hashString = result.toString(this.hashRecipe.base);
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
  public async get<T>(hash: string): Promise<Hashed<T> | undefined> {
    /** recursively try */
    return this.ipfsConnection
      .tryGet(hash, 500, 0)
      .then(raw => {
        let object = CBOR.decode(raw.value.buffer);
        this.logger.log(`Object retrieved ${hash}`, { raw, object });
        return { id: hash, object: object };
      })
      .catch(e => {
        this.logger.warn(`Object with ${hash} not found in IPFS, returning undefined`, e);
        return undefined;
      });
  }
}
