import { HttpConnection, HttpProvider } from '@uprtcl/http-provider';
import { Hashed } from '@uprtcl/cortex';

import { WikisProvider } from '../wikis.provider';
import { Wiki } from '../../types';

const wikis_api: string = 'source';

export class WikisHttp extends HttpProvider implements WikisProvider {
  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: wikis_api
      },
      connection
    );
  }

  get source() {
    return `http:${wikis_api}:${this.options.host}`;
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    return super.getObject<Hashed<T>>(`/get/${hash}`);
  }

  async createWiki(wiki: Wiki, hash: string): Promise<string> {
    const result = await super.post(`/data`, {
      id: hash,
      object: wiki
    });
    return result.elementIds[0];
  }
}
