import Dexie from 'dexie';

import { LocalProposal } from './types';

export class EveesCouncilDB extends Dexie {
  proposals: Dexie.Table<LocalProposal, string>;

  constructor() {
    super('evees-council');
    this.version(1).stores({
      proposals: '&id,toPerspectiveId,*updatedPerspectives'
    });
    this.proposals = this.table('proposals');
  }
}
