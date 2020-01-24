import { injectable } from 'inversify';

import { KnownSourcesService } from '@uprtcl/multiplatform';

import { HolochainProvider } from './holochain.provider';

@injectable()
export abstract class KnownSourcesHolochain extends HolochainProvider
  implements KnownSourcesService {
  zome: string = 'discovery';

  async getUpl(): Promise<string> {
    const response = await this.call('get_uprtcl_provider_locator', {});
    return this.parseResponse(response);
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
