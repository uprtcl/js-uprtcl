import CBOR from 'cbor-js';
import CID from 'cids';
import multihashing from 'multihashing-async';

import { Hashed } from '@uprtcl/cortex';
import { Store } from '@uprtcl/multiplatform';
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

export interface PutConfig {
  format: string,
  hashAlg: string,
  cidVersion: number
}

export class IpfsStore implements Store {
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
  public async put(object: object): Promise<string> {
    let putConfig: PutConfig = {
      format: this.hashRecipe.codec,
      hashAlg: this.hashRecipe.type,
      cidVersion: this.hashRecipe.version
    };

    return this.putIpfs(object, putConfig);
  }

  public async clone(entity: Hashed<object>): Promise<string> {
    const cid = new CID(entity.id);
    const mh = multihashing.multihash.decode(cid.multihash)

    let putConfig: PutConfig = {
      format: cid.codec,
      hashAlg: mh.name,
      cidVersion: cid.version
    };

    return this.putIpfs(entity.object, putConfig);
  }

  private async putIpfs(object: object, putConfig: PutConfig) {
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
  public async get(hash: string): Promise<Hashed<object> | undefined> {
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
