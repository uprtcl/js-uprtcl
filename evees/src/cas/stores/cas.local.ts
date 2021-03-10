import { CASRemote } from '../interfaces/cas-remote';

import { EntityGetResult } from '../interfaces/cas-store';
import { CidConfig } from '../interfaces/cid-config';
import { Entity, EntityCreate } from '../interfaces/entity';
import { cidConfigOf, deriveEntity } from '../utils/cid-hash';
import { EntitiesDB } from './cas.local.db';

/** The CASLocal stores cas entities on IndexedDb */
export class CASLocal implements CASRemote {
  readonly casID = 'local';
  readonly isLocal = true;
  readonly cidConfig: CidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc',
  };

  db!: EntitiesDB;

  constructor() {
    this.db = new EntitiesDB();
  }

  async hashObject(object: object, cidConfig?: CidConfig): Promise<Entity> {
    cidConfig = cidConfig || this.cidConfig;
    return deriveEntity(object, cidConfig, this.casID);
  }

  async storeObject(entityCreate: EntityCreate): Promise<Entity> {
    /** if the hash is already defined, use the same cid config as the input entity */
    const cidConfig = entityCreate.id ? cidConfigOf(entityCreate.id) : this.cidConfig;

    const entity = await this.hashObject(entityCreate.object, cidConfig);
    this.db.entities.put(entity);
    return entity;
  }

  async storeEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((e) => this.storeObject(e)));
  }

  cacheEntities(entities: Entity[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((o) => this.hashObject(o.object)));
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.getEntity(hash)));
    return { entities };
  }

  async flush(): Promise<void> {}

  async diff(): Promise<Entity[]> {
    return [];
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entity = await this.db.entities.get(hash);
    if (!entity) throw new Error('Entity not found');
    return entity;
  }
  async storeEntity(object: any): Promise<Entity> {
    const entities = await this.storeEntities([object]);
    return entities[0];
  }
  async hashEntity<T = any>(object: any): Promise<Entity<T>> {
    const entities = await this.hashEntities([object]);
    return entities[0];
  }
  async ready(): Promise<void> {}
}
