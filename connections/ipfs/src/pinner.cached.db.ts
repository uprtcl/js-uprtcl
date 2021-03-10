import Dexie from 'dexie';

export interface EntityStatus {
  id: string;
  pinned: number;
}

export class PinnerCacheDB extends Dexie {
  entities: Dexie.Table<EntityStatus, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      entities: '&id,pinned',
    });
    this.entities = this.table('entities');
  }
}
