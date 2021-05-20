import { Entity, EntityCreate, EntityRemote } from '../../interfaces';
import { EntityStoreDB } from './entity.store.local.db';

export class EntityRemoteLocal implements EntityRemote {
  id: string = 'local';

  readonly db: EntityStoreDB;

  constructor() {
    this.db = new EntityStoreDB();
  }

  async persistEntities(entities: Entity<any>[]): Promise<void> {
    await Promise.all(entities.map((entity) => this.persistEntity(entity)));
  }

  async persistEntity(entity: Entity<any>): Promise<void> {
    await this.db.entities.put(entity);
  }

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }

  hashObject<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    throw new Error('Method not implemented.');
  }

  removeEntities(hashes: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getEntities(hashes: string[]): Promise<Entity<any>[]> {
    return Promise.all(hashes.map((hash) => this.getEntity(hash)));
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entity = await this.db.entities.get(hash);
    if (!entity) throw new Error(`Entity ${hash} not found`);
    return entity;
  }
}
