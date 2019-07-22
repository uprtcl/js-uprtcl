import { Source } from './source';
import { HolochainConnection, ZomeOptions } from '../../connections/holochain.connection';
import { ConnectionOptions } from '../../connections/connection';

export class HolochainSource implements Source {
  zome: HolochainConnection;

  constructor(zomeOptions: ZomeOptions, options: ConnectionOptions = {}) {
    this.zome = new HolochainConnection(zomeOptions, options);
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<T | undefined> {
    const result = await this.zome.call('get_entry', {
      address: hash
    });

    const entry = this.zome.parseEntryResult<T>(result);

    return entry ? entry.entry : undefined;
  }
}
