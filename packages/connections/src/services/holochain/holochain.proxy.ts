import { Source, Hashed } from '@uprtcl/cortex';
import { HolochainConnection, HolochainConnectionOptions } from './holochain.connection';
import { HolochainProvider } from './holochain.provider';

export class HolochainProxy extends HolochainProvider implements Source {
  constructor(instance: string, connection: HolochainConnection) {
    super({ instance, zome: 'proxy' }, connection);
  }

  async getUpl(): Promise<string> {
    const response = await this.call('get_uprtcl_provider_locator', {});
    return this.parseResponse(response);
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
