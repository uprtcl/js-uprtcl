import Dexie from 'dexie';

export class EveesDB extends Dexie {
  drafts: Dexie.Table<any, string>;

  constructor() {
    super('uprtcl');
    this.version(0.1).stores({
      drafts: ''
    });
    this.drafts = this.table('drafts');
  }
}
