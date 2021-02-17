import lodash from 'lodash-es';
import { CASRemote } from '../interfaces/cas-remote';

import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { CidConfig } from '../interfaces/cid-config';
import { Entity, EntityOn, ObjectOn } from '../interfaces/entity';
import { hashObject } from '../utils/cid-hash';
import { EntitiesDB } from './cas.local.db';

/** The CASLocal stores cas entities on IndexedDb */
export class CASLocal implements CASRemote {
  readonly casID = 'local';
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

  async hashObject(object: object): Promise<Entity<any>> {
    const id = await hashObject(object, this.cidConfig);
    return {
      id,
      object,
    };
  }

  async storeObject(object: object): Promise<Entity<any>> {
    const entity = await this.hashObject(object);
    this.db.entities.put(entity.object, entity.id);
    return entity;
  }
  async storeObjects(objects: object[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((o) => this.storeObject(o)));
  }
  cacheEntities(entities: Entity<any>[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  storeEntities(objects: any[]): Promise<Entity<any>[]> {
    throw new Error('Use storeObjects on CASRemotes');
  }
  hashEntities(objects: ObjectOn[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map((o) => this.hashObject(o.object)));
  }
  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await Promise.all(hashes.map((hash) => this.getEntity(hash)));
    return { entities };
  }
  async flush(): Promise<void> {}
  async getEntity<T = any>(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0] as Entity<T>;
  }
  async storeEntity(object: any): Promise<string> {
    const entities = await this.storeEntities([object]);
    return entities[0].id;
  }
  async hashEntity(object: any): Promise<string> {
    const entities = await this.hashEntities([object]);
    return entities[0].id;
  }
  async ready(): Promise<void> {}
}
