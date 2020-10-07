import Dexie from 'dexie';

import { LocalProposal, Vote } from './types';

export class EveesCouncilDB extends Dexie {
  proposals: Dexie.Table<LocalProposal, string>;
  votes: Dexie.Table<Vote, number>;
  meta: Dexie.Table<any, string>;

  constructor() {
    super('evees-council');
    this.version(1).stores({
      proposals: '&id,toPerspectiveId,*updatedPerspectives',
      votes: 'id++,proposalId,member',
      meta: '&entry'
    });
    this.proposals = this.table('proposals');
    this.votes = this.table('votes');
    this.meta = this.table('meta');
  }
}
