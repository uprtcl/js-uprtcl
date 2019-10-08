import { Source, Hashed } from '@uprtcl/cortex';
import {
  HolochainConnection,
  HolochainConnectionOptions
} from './holochain.connection';
import { ConnectionOptions } from '../../connections/connection';

export class HolochainProxy extends HolochainConnection implements Source {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions) {
    super('proxy', hcOptions, options);
  }

  async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    const response = await this.call('get_proxied_entry', {
      address: hash
    });
    const entry = this.parseEntryResult<T>(response);

    if (!entry) return undefined;

    return entry.entry;
  }
}
