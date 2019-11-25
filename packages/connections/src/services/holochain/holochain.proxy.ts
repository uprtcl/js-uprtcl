import { Source, Hashed } from '@uprtcl/cortex';
import { HolochainConnection, HolochainCallOptions } from './holochain.connection';
import { HolochainProvider } from './holochain.provider';

export function proxyMyAddress(instance: string): HolochainCallOptions {
  return {
    zome: 'proxy',
    funcName: 'get_my_address',
    instance,
    params: {}
  };
}

export class HolochainProxy extends HolochainProvider implements Source {
  constructor(instance: string, connection: HolochainConnection) {
    super(
      {
        instance,
        zome: 'proxy',
        getMyAddress: proxyMyAddress(instance)
      },
      connection
    );
  }

  async getUserAddress(): Promise<string> {
    const response = await this.call('get_my_address', {});
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
