import Dexie from 'dexie';

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EveesDB extends Dexie {
  drafts: Dexie.Table<any, string>;

  constructor() {
    super('uprtcl');
    this.version(0.1).stores({
      drafts: '',
    });
    this.drafts = this.table('drafts');
  }
}
