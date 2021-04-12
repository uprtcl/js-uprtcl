import Dexie from 'dexie';
import { Entity } from '../interfaces/entity';

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EntitiesDB extends Dexie {
  entities: Dexie.Table<Entity, string>;
  newEntities: Dexie.Table<Entity, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-entities-store`);
    this.version(0.1).stores({
      entities: '&id',
      newEntities: '&id',
    });
    this.entities = this.table('entities');
    this.newEntities = this.table('newEntities');
  }
}
