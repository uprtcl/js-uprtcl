import { NamedSource, Hashed } from '@uprtcl/cortex';
import { HolochainConnection } from '../../connections/holochain/holochain.connection';

export class HolochainSource extends HolochainConnection implements NamedSource {
  name!: string;

  protected async connect(): Promise<void> {
    await super.connect();

    this.name = await this.call('get_source_name', {});
  }

  /**
   * @override
   */
  public async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    const result = await this.call('get_entry', {
      address: hash
    });

    const entry = this.parseEntryResult<T>(result);

    return entry ? entry.entry : undefined;
  }
}
