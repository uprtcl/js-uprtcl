import { Entity } from '@uprtcl/cortex';
import Dexie from 'dexie';

export class CASStoreLocalDB extends Dexie {
  entities: Dexie.Table<Entity<any>, string>;

  constructor(name: string) {
    super(name);
    this.version(0.1).stores({
      entities: '&id'
    });
    this.entities = this.table('entities');
  }
}
