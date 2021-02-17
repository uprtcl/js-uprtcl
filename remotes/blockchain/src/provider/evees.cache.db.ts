import Dexie from 'dexie';
import { UpdatePerspectiveLocal, NewPerspectiveLocal } from '../types';
export class EveesCacheDB extends Dexie {
  updates: Dexie.Table<UpdatePerspectiveLocal, string>;
  newPerspectives: Dexie.Table<NewPerspectiveLocal, string>;
  deletePerspectives: Dexie.Table<{ id: string }, string>;
  meta: Dexie.Table<any, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      updates: '&id',
      newPerspectives: '&id,context',
      deletePerspectives: '&id',
      meta: '&entry'
    });
    this.updates = this.table('updates');
    this.newPerspectives = this.table('newPerspectives');
    this.deletePerspectives = this.table('deletePerspectives');
    this.meta = this.table('meta');
  }
}
