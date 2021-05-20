import Dexie from 'dexie';
import { Entity } from '../../interfaces/entity';

export class EntityStoreDB extends Dexie {
  entities: Dexie.Table<Entity, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-entities-store`);

    this.version(0.1).stores({
      entities: '&hash',
    });

    this.entities = this.table('entities');
  }
}
