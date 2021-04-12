import { Logger, CASRemote, CidConfig, Entity, EntityGetResult, hashObject } from '@uprtcl/evees';
import { EntityCreate } from '@uprtcl/evees/dist/types/cas/interfaces/entity';
import { HttpConnection } from '@uprtcl/http-provider';

const store_api = 'store';

const httpCidConfig: CidConfig = {
  base: 'base58btc',
  version: 1,
  codec: 'raw',
  type: 'sha3-256',
};

const LOGINFO = false;

export class HttpStore implements CASRemote {
  logger = new Logger('Http Store');
  isLocal: boolean = false;

  constructor(protected connection: HttpConnection, public cidConfig: CidConfig) {}

  get casID() {
    return `http:${store_api}:${this.connection.host}`;
  }

  ready() {
    return Promise.resolve();
  }

  async get(hash: string): Promise<Entity> {
    return this.connection.get<Entity>(`/data/${hash}`);
  }

  async hash(object: object): Promise<Entity> {
    const cidConfig = httpCidConfig;
    /** optimistically hash based on the CidConfig without asking the server */
    const id = await hashObject(object, cidConfig);

    const entity = {
      id,
      object: { ...object },
      casID: this.casID,
    };

    if (LOGINFO)
      this.logger.log('hash', {
        entity,
        cidConfig,
        objectStr: JSON.stringify(entity.object),
        cidConfigStr: JSON.stringify(cidConfig),
      });

    return entity;
  }

  cacheEntities(entities: Entity[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async storeEntities(entities: EntityCreate[]): Promise<Entity[]> {
    const result: any = await this.connection.post('/data', {
      datas: entities,
    });
    return result.entities;
  }

  async removeEntities(hashes: string[]) {
    throw new Error('not implemented');
  }

  hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((e) => this.hash(e.object)));
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.get(hash)));
    // mark the casID from which the entities are coming
    entities.forEach((e) => (e.casID = this.casID));
    return { entities };
  }

  async flush(): Promise<void> {}

  async diff(): Promise<Entity[]> {
    return [];
  }

  async getEntity(hash: string): Promise<Entity> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  async storeEntity(entity: EntityCreate): Promise<Entity> {
    const entities = await this.storeEntities([entity]);
    return entities[0];
  }

  async hashEntity(entity: EntityCreate): Promise<Entity> {
    const entities = await this.hashEntities([entity]);
    return entities[0];
  }
}
