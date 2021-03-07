import Dexie from 'dexie';
import { Entity } from '../interfaces/entity';

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EntitiesDB extends Dexie {
  entities: Dexie.Table<Entity<any>, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-entities-store`);
    this.version(0.1).stores({
      entities: '&id',
    });
    this.entities = this.table('entities');
  }
}
