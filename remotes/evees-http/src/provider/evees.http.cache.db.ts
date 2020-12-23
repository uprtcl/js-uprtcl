import { NewPerspectiveData, PerspectiveDetails } from '@uprtcl/evees';
import Dexie from 'dexie';

export interface UpdatePerspectiveLocal {
  id: string;
  head: string;
}

export interface NewPerspectiveLocal {
  id: string;
  context: string;
  newPerspective: NewPerspectiveData;
}

export class EveesHttpCacheDB extends Dexie {
  updates: Dexie.Table<UpdatePerspectiveLocal, string>;
  newPerspectives: Dexie.Table<NewPerspectiveLocal, string>;
  deletePerspectives: Dexie.Table<{ id: string }, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      updates: '&id',
      newPerspectives: '&id,context',
      deletePerspectives: '&id',
      meta: '&entry',
    });
    this.updates = this.table('updates');
    this.newPerspectives = this.table('newPerspectives');
    this.deletePerspectives = this.table('deletePerspectives');
  }
}
