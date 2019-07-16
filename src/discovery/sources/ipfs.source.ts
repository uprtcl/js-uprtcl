import { Source } from './source';
import { IpfsConnection } from '../../connections/ipfs.connection';

export class IpfsSource implements Source {
  constructor(
    protected ipfsConnection: IpfsConnection = new IpfsConnection({ host: 'ipfs.infura.io' })
  ) {}

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<T | undefined> {
    return this.ipfsConnection.get(hash);
  }
}
