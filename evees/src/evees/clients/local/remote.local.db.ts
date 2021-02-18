import Dexie from 'dexie';
import { PerspectiveDetails } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  context: string;
  details: PerspectiveDetails;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EveesDB extends Dexie {
  perspectives: Dexie.Table<PerspectiveLocal, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-evees-store`);
    this.version(0.1).stores({
      perspectives: '&id,context',
    });
    this.perspectives = this.table('perspectives');
  }
}
