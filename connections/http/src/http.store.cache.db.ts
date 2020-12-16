import Dexie from 'dexie';

export interface EntityStatus {
  id: string;
  object: any;
  stored: number;
}

export class EntitiesCacheDB extends Dexie {
  entities: Dexie.Table<EntityStatus, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      entities: '&id,stored',
    });
    this.entities = this.table('entities');
  }
}
