import {
  Entity,
  EntityCreate,
  EntityRemote,
  hashObject,
  CidConfig,
  Logger,
  validateEntities,
} from '@uprtcl/evees';
import { HttpAuthenticatedConnection } from '@uprtcl/http-provider';

const LOGINFO = false;

const httpCidConfig: CidConfig = {
  base: 'base58btc',
  version: 1,
  codec: 'raw',
  type: 'sha3-256',
};

const entities_api = 'entities-v1';

export class HttpEntityRemote implements EntityRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  constructor(public connection: HttpAuthenticatedConnection) {}

  get id() {
    return `http:${entities_api}`;
  }

  async hash(object: object): Promise<Entity> {
    const cidConfig = httpCidConfig;
    /** optimistically hash based on the CidConfig without asking the server */
    const hash = await hashObject(object, cidConfig);

    const entity = {
      hash,
      object: { ...object },
      remote: this.id,
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

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return Promise.all(entities.map((entity) => this.hashObject(entity)));
  }

  async hashObject<T = any>(entityCreate: EntityCreate<any>): Promise<Entity<T>> {
    const entity = await this.hash(entityCreate.object);
    if (entityCreate.hash) {
      validateEntities([entity], [entityCreate]);
    }
    return entity;
  }

  storeEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  storeEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }

  async persistEntities(entities: Entity<any>[]): Promise<void> {
    const result: any = await this.connection.post('/data', {
      datas: entities,
    });
    return result.entities;
  }

  async persistEntity(entity: Entity<any>): Promise<void> {
    await this.persistEntities([entity]);
  }

  removeEntities(hashes: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getEntities(hashes: string[]): Promise<Entity<any>[]> {
    const entities = await Promise.all(
      hashes.map((hash) => {
        return this.connection.getWithPut<Entity>(`/data`, { hashes });
      })
    );
    // mark the casID from which the entities are coming
    entities.forEach((e) => (e.remote = this.id));
    return entities;
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }
}
