import Dexie from 'dexie';
import { Entity } from '../../interfaces/entity';
import { NewPerspective, PerspectiveDetails, Update } from '../../interfaces/types';

export interface PerspectiveLocal {
  perspectiveId: string;
  details: PerspectiveDetails;
  onEcosystem: string[];
}

export interface NewPerspectiveLocal {
  perspectiveId: string;
  newPerspective: NewPerspective;
}

export interface UpdateLocal {
  /** the id is a combination of perspectiveId and newHeadId */
  id: string;
  perspectiveId: string;
  update: Update;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class MutationStoreDB extends Dexie {
  perspectivesDetails: Dexie.Table<PerspectiveLocal, string>;
  newPerspectives: Dexie.Table<NewPerspectiveLocal, string>;
  updates: Dexie.Table<UpdateLocal, string>;
  deletedPerspectives: Dexie.Table<string, string>;

  constructor(prefix: string = 'client-local') {
    super(`${prefix}-evees-store`);

    this.version(0.1).stores({
      perspectivesDetails: '&perspectiveId,*onEcosystem',
      newPerspectives: '&perspectiveId',
      updates: '&id,perspectiveId',
      deletedPerspectives: '&perspectiveId',
    });

    this.perspectivesDetails = this.table('perspectivesDetails');
    this.newPerspectives = this.table('newPerspectives');
    this.updates = this.table('updates');
    this.deletedPerspectives = this.table('deletedPerspectives');
  }
}
