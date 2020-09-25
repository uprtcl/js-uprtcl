import Dexie from 'dexie';

export class EveesCouncilDB extends Dexie {
  drafts: Dexie.Table<any, string>;

  constructor() {
    super('evees-council');
    this.version(1).stores({
      proposals: '++id,toPerspectiveId,*updates',
      updates: '++id, perspectiveId, headId',
      votes: '++id,*proposal,value',
      attestations: '++id,*proposal,block'
    });
    this.drafts = this.table('drafts');
  }
}
