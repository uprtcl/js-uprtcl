import Dexie from 'dexie';
import { PerspectiveDetails } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  context: string;
  details: PerspectiveDetails;
  children?: string[];
  linksTo?: string[];
  // ecosystem?: string[];
  text?: string;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EveesDB extends Dexie {
  perspectives: Dexie.Table<PerspectiveLocal, string>;

  constructor(prefix: string = 'local') {
    super(`${prefix}-evees-store`);
    this.version(0.1).stores({
      perspectives: '&id,context,*children,*linksTo,*ecosystem,text',
    });
    this.perspectives = this.table('perspectives');
  }
}
