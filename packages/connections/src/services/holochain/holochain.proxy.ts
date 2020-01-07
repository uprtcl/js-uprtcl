import { Hashed } from '@uprtcl/cortex';
import { Source } from '@uprtcl/multiplatform';

import { HolochainConnection, HolochainCallOptions } from './holochain.connection';
import { HolochainProvider } from './holochain.provider';
import { injectable } from 'inversify';

export function proxyMyAddress(instance: string): HolochainCallOptions {
  return {
    zome: 'proxy',
    funcName: 'get_my_address',
    instance,
    params: {}
  };
}

@injectable()
export abstract class HolochainProxy extends HolochainProvider implements Source {
  zome: string = 'proxy';

  async getMyAddress(): Promise<string> {
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
