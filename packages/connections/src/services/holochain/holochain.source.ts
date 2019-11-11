import { SourceProvider, Hashed } from '@uprtcl/cortex';

import { HolochainProvider, HolochainProviderOptions } from './holochain.provider';
import { HolochainConnection } from './holochain.connection';
import { HolochainProxy } from './holochain.proxy';

export class HolochainSource extends HolochainProvider implements SourceProvider {
  constructor(
    protected hcOptions: HolochainProviderOptions,
    protected connection: HolochainConnection,
    protected sourceZome: HolochainProxy = new HolochainProxy(hcOptions.instance, connection)
  ) {
    super(hcOptions, connection);
  }

  /**
   * @override
   */
  public async ready() {
    await Promise.all([this.connection.ready(), this.sourceZome.ready()]);

    this.uprtclProviderLocator = await this.sourceZome.getUpl();
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.sourceZome.get(hash);
  }
}
