import { KnownSourcesService } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { HttpConnection } from './http.connection';
import { HttpProvider } from './http.provider';

const uprtcl_api: string = 'uprtcl-ks-v1';
export class KnownSourcesHttp extends HttpProvider implements KnownSourcesService {
  logger = new Logger('HTTP-KNOWN-SRC-PROVIDER');

  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: uprtcl_api,
      },
      connection
    );
  }

  async getKnownSources(hash: string): Promise<string[]> {
    return super.getObject<string[]>(`/discovery/${hash}`);
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    await super.httpPut(`/discovery/${hash}`, sources);
  }

  async removeKnownSource(hash: string, source: string): Promise<void> {
    console.log({ hash, source });
    throw new Error('Method not implemented');
  }
}
