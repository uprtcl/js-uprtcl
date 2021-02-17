import Dexie from 'dexie';
import { PerspectiveDetails } from '../../interfaces/types';

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EveesDB extends Dexie {
  perspectives: Dexie.Table<PerspectiveDetails, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-evees-store`);
    this.version(0.1).stores({
      perspectives: '&id',
    });
    this.perspectives = this.table('perspectives');
  }
}
