import { HttpProvider } from './http.provider';
import {
  Logger,
  CASRemote,
  CidConfig,
  Entity,
  Ready,
  ObjectOnRemote,
  EntityGetResult,
} from '@uprtcl/evees';

const store_api = 'store';

export class HttpStore implements CASRemote {
  logger = new Logger('Http Store');

  constructor(protected provider: HttpProvider, public cidConfig: CidConfig) {}
  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  getEntities(hashes: string[]): Promise<EntityGetResult> {
    throw new Error('Method not implemented.');
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getEntity(uref: string): Promise<Entity<any>> {
    throw new Error('Method not implemented.');
  }
  storeEntity(object: ObjectOnRemote): Promise<string> {
    throw new Error('Method not implemented.');
  }
  hashEntity(object: ObjectOnRemote): Promise<string> {
    throw new Error('Method not implemented.');
  }

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
      object: object,
    });
    return result.elementIds[0];
  }
}
