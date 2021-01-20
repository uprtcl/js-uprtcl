import {
  Logger,
  CASRemote,
  CidConfig,
  Entity,
  ObjectOnRemote,
  EntityGetResult,
  hashObject,
} from '@uprtcl/evees';
import { HttpConnectionLogged } from '@uprtcl/http-provider';

const store_api = 'store';

const httpCidConfig: CidConfig = {
  base: 'base58btc',
  version: 1,
  codec: 'raw',
  type: 'sha3-256',
};

export class HttpStore implements CASRemote {
  logger = new Logger('Http Store');

  constructor(protected connection: HttpConnectionLogged, public cidConfig: CidConfig) {}

  get casID() {
    return `http:${store_api}:${this.connection.host}`;
  }

  ready() {
    return Promise.resolve();
  }

  async get(hash: string): Promise<Entity<any>> {
    const object = await this.connection.get<object>(`/get/${hash}`);
    return {
      id: hash,
      object,
    };
  }

  async create(object: object, hash?: string): Promise<Entity<any>> {
    this.logger.log('Creating Entity', { object, hash });
    const result = await this.connection.post(`/data`, {
      id: hash ? hash : '',
      object: object,
    });
    return {
      id: result.elementIds[0],
      object,
    };
  }

  async hash(object: object) {
    const id = await hashObject(object, httpCidConfig);
    return {
      id,
      object,
    };
  }

  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((object) => this.create(object.object)));
  }

  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((object) => this.hash(object.object)));
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    return { entities };
  }

  async flush(): Promise<void> {}

  async getEntity(hash: string): Promise<Entity<any>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  async storeEntity(object: ObjectOnRemote): Promise<string> {
    const entities = await this.storeEntities([object]);
    return entities[0].id;
  }

  async hashEntity(object: ObjectOnRemote): Promise<string> {
    const entities = await this.hashEntities([object]);
    return entities[0].id;
  }
}
