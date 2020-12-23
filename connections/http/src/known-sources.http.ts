import { KnownSourcesService } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpProvider } from './http.provider';

export class KnownSourcesHttp implements KnownSourcesService {
  logger = new Logger('HTTP-KNOWN-SRC-PROVIDER');

  constructor(protected provider: HttpProvider) {}

  ready() {
    return Promise.resolve();
  }

  async getKnownSources(hash: string): Promise<string[]> {
    return this.provider.getObject<string[]>(`/discovery/${hash}`);
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    await this.provider.put(`/discovery/${hash}`, sources);
  }

  async removeKnownSource(hash: string, source: string): Promise<void> {
    console.log({ hash, source });
    throw new Error('Method not implemented');
  }
}
