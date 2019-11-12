import { Buffer } from 'ipfs-http-client';

import { Hashed, SourceProvider } from '@uprtcl/cortex';

import { CidConfig, defaultCidConfig } from './cid.config';
import { IpfsConnection } from './ipfs.connection';
import { Logger } from '@uprtcl/micro-orchestrator';

export class IpfsSource implements SourceProvider {
  logger = new Logger('IpfsSource');

  constructor(protected ipfsConnection: IpfsConnection) {}

  uprtclProviderLocator = 'ipfs:api-v1:mainnet';

  private getObjectBuffer(object: object): Buffer {
    return Buffer.from(JSON.stringify(object));
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
  public async addObject(object: object, cidConfig: CidConfig = defaultCidConfig): Promise<string> {
    let putConfig = {
      format: cidConfig.codec,
      hashAlg: cidConfig.type,
      cidVersion: cidConfig.version
    };

    this.logger.log(`Trying to add object:`, object);

    const buffer = this.getObjectBuffer(object);

    /** recursively try */
    return this.ipfsConnection
      .tryPut(buffer, putConfig, 500, 0)
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
    return this.ipfsConnection
      .tryGet(hash, 500, 0)
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
