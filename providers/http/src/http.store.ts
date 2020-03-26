import { Hashed } from '@uprtcl/cortex';
import { CidConfig } from '@uprtcl/ipfs-provider';
import { Store } from '@uprtcl/multiplatform';

import { HttpProvider } from './http.provider';
import { HttpConnection } from './http.connection';

const store_api = 'store';

export class HttpStore extends HttpProvider implements Store {

  constructor(
    protected host: string, 
    protected connection: HttpConnection, 
    public hashRecipe: CidConfig) {

    super(
      {
        host: host,
        apiId: store_api
      },
      connection
    );
  }

  get source() {
    return `http:${store_api}:${this.host}`;
  }

  async get(hash: string): Promise<Hashed<object>> {
    return super.getObject<Hashed<object>>(`/get/${hash}`);
  }

  async put(object: object): Promise<string> {
    const result = await super.httpPost(`/data`, {
      id: '',
      object: object
    });
    return result.elementIds[0];
  }

  async clone(entity: Hashed<object>): Promise<string> {
    const result = await super.httpPost(`/data`, {
      entity
    });
    return result.elementIds[0];
  }
}
