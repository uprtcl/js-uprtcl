import Dexie from 'dexie';

export interface UpdatePerspectiveLocal {
  id: string;
  head: string;
}

export interface NewPerspectiveLocal {
  id: string;
  head?: string;
  context: string;
}

export class EveesCacheDB extends Dexie {
  updates: Dexie.Table<UpdatePerspectiveLocal, string>;
  newPerspectives: Dexie.Table<NewPerspectiveLocal, string>;
  meta: Dexie.Table<any, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      updates: '&id',
      newPerspectives: '&id,context',
      meta: '&entry'
    });
    this.updates = this.table('updates');
    this.newPerspectives = this.table('newPerspectives');
    this.meta = this.table('meta');
  }
}
