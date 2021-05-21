import Dexie from 'dexie';
import { PerspectiveDetails } from '../../interfaces';

export interface PerspectiveLocal {
  perspectiveId: string;
  details: PerspectiveDetails;
  context: string;
  children?: string[];
  levels?: number;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class PerspectivesStoreDB extends Dexie {
  perspectivesDetails: Dexie.Table<PerspectiveLocal, string>;

  constructor(prefix: string = 'perspectives-local') {
    super(`${prefix}-evees-store`);

    this.version(0.1).stores({
      perspectivesDetails: '&perspectiveId,*onEcosystem',
    });

    this.perspectivesDetails = this.table('perspectivesDetails');
  }
}
