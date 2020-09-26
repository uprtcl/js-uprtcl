import Dexie from 'dexie';

import { CouncilMember, DexieProposal } from './types';

export class EveesCouncilDB extends Dexie {
  proposals: Dexie.Table<DexieProposal, string>;
  council: Dexie.Table<CouncilMember, number>;

  constructor() {
    super('evees-council');
    this.version(1).stores({
      council: 'id++,block,member',
      proposals: '&id,toPerspectiveId'
    });
    this.council = this.table('council');
    this.proposals = this.table('proposals');
  }
}
