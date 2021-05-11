import Dexie from 'dexie';
import { Entity } from '../../interfaces/entity';
import { NewPerspective, PerspectiveDetails, Update } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  details: PerspectiveDetails;
  onEcosystem: string[];
}

export interface NewPerspectiveLocal {
  id: string;
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
  entities: Dexie.Table<Entity, string>;

  constructor(prefix: string = 'client-local') {
    super(`${prefix}-evees-store`);

    this.version(0.1).stores({
      perspectivesDetails: '&id,*onEcosystem',
      newPerspectives: '&id',
      updates: '&id,perspectiveId',
      deletedPerspectives: '&id',
      entities: '&id',
    });

    this.perspectivesDetails = this.table('perspectivesDetails');
    this.newPerspectives = this.table('newPerspectives');
    this.updates = this.table('updates');
    this.deletedPerspectives = this.table('deletedPerspectives');
    this.entities = this.table('entities');
  }
}
