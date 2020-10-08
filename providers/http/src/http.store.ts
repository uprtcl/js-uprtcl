import { CASStore, CidConfig } from '@uprtcl/multiplatform';

import { HttpProvider } from './http.provider';
import { HttpConnection } from './http.connection';
import { Logger } from '@uprtcl/micro-orchestrator';

const store_api = 'store';

export class HttpStore implements CASStore {
  logger = new Logger('Http Store');

  constructor(protected provider: HttpProvider, public cidConfig: CidConfig) {}

  get casID() {
    return `http:${store_api}:${this.provider.pOptions.host}`;
  }

  ready() {
    return Promise.resolve();
  }

  async get(hash: string): Promise<object> {
    return this.provider.getObject<object>(`/get/${hash}`);
  }

  async create(object: object, hash?: string): Promise<string> {
    this.logger.log('Creating Entity', { object, hash });
    const result = await this.provider.post(`/data`, {
      id: hash ? hash : '',
      object: object
    });
    return result.elementIds[0];
  }
}
