import Dexie from 'dexie';

import { LocalPerspective, LocalProposal, LocalVote } from './types';

export class EveesCouncilDB extends Dexie {
  proposals: Dexie.Table<LocalProposal, string>;
  perspectives: Dexie.Table<LocalPerspective, string>;
  votes: Dexie.Table<LocalVote, string>;
  meta: Dexie.Table<any, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      proposals: '&id,toPerspectiveId',
      perspectives: '&id,context',
      votes: '&id,proposalId,member',
      meta: '&entry'
    });
    this.proposals = this.table('proposals');
    this.perspectives = this.table('perspectives');
    this.votes = this.table('votes');
    this.meta = this.table('meta');
  }
}
