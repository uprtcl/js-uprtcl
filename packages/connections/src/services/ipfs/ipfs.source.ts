import ipfsClient, { Buffer } from 'ipfs-http-client';

import { Hashed, NamedSource } from '@uprtcl/cortex';

import { ConnectionOptions, Connection } from '../../connections/connection';
import { CidConfig, defaultCidConfig } from './cid.config';

export interface IpfsConnectionOptions {
  host: string;
  port: number;
  protocol: string;
  headers?: { [key: string]: string };
}

export class IpfsSource extends Connection implements NamedSource {
  client: any;

  name = 'ipfs';

  constructor(
    protected ipfsOptions: IpfsConnectionOptions,
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

  private getObjectBuffer(object: object): Buffer {
    return Buffer.from(JSON.stringify(object));
  }

  private tryPut(buffer: Buffer, putConfig: object, wait: number, attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Try put. Attempt: ${attempt}`);

      if (attempt > 10) {
        reject();
      }

      /** retry recursively with twice as much the wait time setting */
      let timeout = setTimeout(() => {
        this.tryPut(buffer, putConfig, wait * 2, attempt + 1)
          .then((result: any) => resolve(result))
          .catch(e => reject(e));
      }, wait);

      this.client.dag.put(buffer, putConfig).then((result: object) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  private tryGet(hash: string, wait: number, attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Trying to get ${hash}. Attempt: ${attempt}`);

      if (attempt > 10) {
        reject();
      }

      /** retry recursively with twice as much the wait time setting */
      let timeout = setTimeout(() => {
        this.tryGet(hash, wait * 2, attempt + 1)
          .then(result => resolve(result))
          .catch(e => reject(e));
      }, wait);

      this.client.dag.get(hash).then((result: any) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  /**
   * Adds a raw js object to IPFS with the given cid configuration
   */
  public async addObject(object: object, cidConfig: CidConfig = defaultCidConfig): Promise<string> {
    let putConfig = {
      format: cidConfig.codec,
      hashAlg: cidConfig.type,
      cidVersion: cidConfig.version
    };

    const buffer = this.getObjectBuffer(object);

    /** recursively try */
    return this.tryPut(buffer, putConfig, 500, 0)
      .then((result: any) => {
        let hashString = result.toString(cidConfig.base);
        this.logger.log(`Object stored`, object, { hashString });
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
    return this.tryGet(hash, 500, 0)
      .then(raw => {
        let object = JSON.parse(Buffer.from(raw.value).toString());
        this.logger.log(`Object retrieved ${hash}`, object);
        return { id: hash, object: object };
      })
      .catch(e => {
        this.logger.error(`Impossible to get ${hash} from IPFS, returning null`, e);
        return undefined;
      });
  }
}
