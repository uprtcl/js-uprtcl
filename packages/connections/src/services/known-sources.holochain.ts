import { KnownSourcesService } from '@uprtcl/cortex';
import {
  HolochainConnection,
  HolochainConnectionOptions
} from '../connections/holochain/holochain.connection';

export class KnownSourcesHolochain implements KnownSourcesService {
  discoveryZome: HolochainConnection;

  constructor(options: HolochainConnectionOptions) {
    this.discoveryZome = new HolochainConnection('discovery', options);
  }

  getOwnSource(): Promise<string> {
    return this.discoveryZome.call('get_own_source', {});
  }

  getKnownSources(hash: string): Promise<string[]> {
    return this.discoveryZome.call('get_known_sources', { address: hash });
  }
  addKnownSources(hash: string, sources: string[]): Promise<void> {
    return this.discoveryZome.call('add_known_sources', {
      address: hash,
      sources: sources
    });
  }

  removeKnownSource(hash: string, source: string): Promise<void> {
    return this.discoveryZome.call('remove_known_source', {
      address: hash,
      source: source
    });
  }
}
