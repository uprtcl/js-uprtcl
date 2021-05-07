import { Entity, EntityCreate } from './entity';

export interface EntityRemote {
  entityRemoteId: string;

  /** Only the ClientRemote is able to store entities, everyone else us
   * the EntityResolver */
  persistEntities(entities: Entity[]): Promise<void>;
  persistEntity(entity: Entity): Promise<void>;

  hashObjects(entities: EntityCreate[]): Promise<Entity[]>;
  hashObject<T = any>(entity: EntityCreate): Promise<Entity<T>>;

  removeEntities(hashes: string[]): Promise<void>;

  getEntities(hashes: string[]): Promise<Entity[]>;
  getEntity<T = any>(hash: string): Promise<Entity<T>>;
}
