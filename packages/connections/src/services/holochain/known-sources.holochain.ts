import { KnownSourcesService } from '@uprtcl/cortex';
import { HolochainConnection, HolochainConnectionOptions } from './holochain.connection';
import { ConnectionOptions } from '../../connections/connection';
import { HolochainProvider, HolochainProviderOptions } from './holochain.provider';

export class KnownSourcesHolochain extends HolochainProvider implements KnownSourcesService {
  constructor(instance: string, connection: HolochainConnection) {
    super({ instance, zome: 'discovery' }, connection);
  }

  getOwnSource(): Promise<string> {
    return this.call('get_own_source', {});
  }

  getKnownSources(hash: string): Promise<string[]> {
    return this.call('get_known_sources', { address: hash });
  }
  addKnownSources(hash: string, sources: string[]): Promise<void> {
    return this.call('add_known_sources', {
      address: hash,
      sources: sources
    });
  }

  removeKnownSource(hash: string, source: string): Promise<void> {
    return this.call('remove_known_source', {
      address: hash,
      source: source
    });
  }
}
