import Dexie from 'dexie';
import { Vote } from '../../proposals/voted.proposals';
import { Proposal } from '../../proposals/types';

export class ProposalsStoreDB extends Dexie {
  proposals: Dexie.Table<Proposal, string>;
  votes: Dexie.Table<Vote, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-proposals-store`);

    this.version(0.1).stores({
      proposals: '&id',
      votes: 'proposalId',
    });

    this.proposals = this.table('proposals');
    this.votes = this.table('votes');
  }
}
