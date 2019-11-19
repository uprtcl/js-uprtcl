import { SourceProvider, Hashed } from '@uprtcl/cortex';

import { HolochainProvider, HolochainProviderOptions } from './holochain.provider';
import { HolochainConnection } from './holochain.connection';
import { HolochainProxy, proxyMyAddress } from './holochain.proxy';
import { KnownSourcesHolochain } from './known-sources.holochain';

export interface HolochainSourceOptions {
  instance: string;
  zome: string;
  getMyAddress?: {
    instance: string;
    zome: string;
    funcName: string;
  };
}

export class HolochainSource extends HolochainProvider implements SourceProvider {
  constructor(
    protected hcSourceOptions: HolochainSourceOptions,
    protected connection: HolochainConnection,
    protected sourceZome: HolochainProxy = new HolochainProxy(hcSourceOptions.instance, connection),
    protected discoveryZome: KnownSourcesHolochain = new KnownSourcesHolochain(hcSourceOptions.instance, connection),
  ) {
    super(
      { getMyAddress: proxyMyAddress(hcSourceOptions.instance), ...hcSourceOptions },
      connection
    );
  }

  getUserAddress(): Promise<string> {
    return this.sourceZome.getUserAddress();
  }

  /**
   * @override
   */
  public async ready() {
    await Promise.all([this.connection.ready(), this.sourceZome.ready()]);

    this.uprtclProviderLocator = await this.discoveryZome.getUpl();
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.sourceZome.get(hash);
  }
}
