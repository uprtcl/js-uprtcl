import { NamedSource } from '@uprtcl/cortex';

import { IpfsConnection } from '../../connections/ipfs.connection';

export class IpfsSource implements NamedSource {

  name: string = 'ipfs';

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
