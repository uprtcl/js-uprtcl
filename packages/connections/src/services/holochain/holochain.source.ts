import { NamedSource, Hashed } from '@uprtcl/cortex';
import { HolochainConnection, HolochainConnectionOptions } from './holochain.connection';
import { ConnectionOptions } from '../../connections/connection';
import { HolochainProxy } from './holochain.proxy';

export class HolochainSource extends HolochainConnection implements NamedSource {
  name!: string;

  constructor(
    protected zome: string,
    protected hcOptions: HolochainConnectionOptions,
    options: ConnectionOptions = {},
    protected sourceZome: HolochainProxy = new HolochainProxy(hcOptions, options)
  ) {
    super(zome, hcOptions, options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    await super.connect();

    this.name = await this.sourceZome.getName();
  }

  /**
   * @override
   */
  public async ready() {
    await Promise.all([super.ready(), this.sourceZome.ready()]);
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.sourceZome.get(hash);
  }
}
