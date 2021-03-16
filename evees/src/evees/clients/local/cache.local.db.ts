import Dexie from 'dexie';
import { NewPerspective, PerspectiveDetails, Update } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  context: string;
  details: PerspectiveDetails;
  onEcosystem?: string;
  levels?: number;
}

export interface NewPerspectiveLocal {
  id: string;
  newPerspective: NewPerspective;
}

export interface UpdateLocal {
  id: string;
  update: Update;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class EveesCacheDB extends Dexie {
  perspectives: Dexie.Table<PerspectiveLocal, string>;
  newPerspectives: Dexie.Table<NewPerspectiveLocal, string>;
  updates: Dexie.Table<UpdateLocal, string>;
  deletedPerspectives: Dexie.Table<string, string>;

  constructor(prefix: string = 'client-local') {
    super(`${prefix}-evees-store`);

    this.version(0.1).stores({
      perspectives: '&id,context,onEcosystem',
      newPerspectives: '&id',
      updates: '&id',
      deletedPerspectives: '&id',
    });

    this.perspectives = this.table('perspectives');
    this.newPerspectives = this.table('newPerspectives');
    this.updates = this.table('updates');
    this.deletedPerspectives = this.table('deletedPerspectives');
  }
}
