import { HolochainConnection, HolochainConnectionOptions } from '@uprtcl/connections';
import { Source, Hashed } from '@uprtcl/cortex';


export class ProxyProvider implements Source {
  proxyZome: HolochainConnection;

  constructor(options: HolochainConnectionOptions) {
    this.proxyZome = new HolochainConnection('proxy', options);
  }

  async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    const response = await this.proxyZome.call('get_proxied_entry', {
      address: hash
    });
    const entry = this.proxyZome.parseEntryResult<T>(response);

    if (!entry) return undefined;

    return entry.entry;
  }

}
