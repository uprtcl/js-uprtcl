import Dexie from 'dexie';

export class PinnedCacheDB extends Dexie {
  pinned: Dexie.Table<{ id: string }, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      pinned: '&id'
    });
    this.pinned = this.table('pinned');
  }
}
