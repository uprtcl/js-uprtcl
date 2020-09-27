import Dexie from 'dexie';

import { DexieProposal } from './types';

export class EveesCouncilDB extends Dexie {
  proposals: Dexie.Table<DexieProposal, string>;

  constructor() {
    super('evees-council');
    this.version(1).stores({
      proposals: '&id,toPerspectiveId,*updatedPerspectives'
    });
    this.proposals = this.table('proposals');
  }
}
