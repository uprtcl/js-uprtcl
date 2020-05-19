import { CASStore, CidConfig } from '@uprtcl/multiplatform';

import { HttpProvider } from './http.provider';
import { HttpConnection } from './http.connection';

const store_api = 'store';

export class HttpStore extends HttpProvider implements CASStore {
  constructor(
    protected host: string,
    protected connection: HttpConnection,
    public cidConfig: CidConfig
  ) {
    super(
      {
        host: host,
        apiId: store_api,
      },
      connection
    );
  }

  get casID() {
    return `http:${store_api}:${this.host}`;
  }

  async get(hash: string): Promise<object> {
    return super.getObject<object>(`/get/${hash}`);
  }

  async create(object: object, hash?: string): Promise<string> {
    const result = await super.httpPost(`/data`, {
      id: '',
      object: object,
    });
    return result.elementIds[0];
  }
}
