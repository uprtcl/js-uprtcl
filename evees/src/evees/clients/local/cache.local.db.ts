import Dexie from 'dexie';
import { NewPerspective, PerspectiveDetails, Update } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  context: string;
  details: PerspectiveDetails;
  /** need to index to decide if delete a data entity */
  dataId: string | undefined;
  children?: string[];
  onEcosystem?: string[];
  levels?: number;
}

export interface NewPerspectiveLocal {
  id: string;
  /** need to index to decide if delete a data entity */
  dataId: string | undefined;
  newPerspective: NewPerspective;
}

export interface UpdateLocal {
  /** the id is a combination of perspectiveId and newHeadId */
  id: string;
  perspectiveId: string;
  timextamp: number;
  /** need to index to decide if delete a data entity */
  dataId: string | undefined;
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
      perspectives: '&id,context,*onEcosystem,*children,dataId',
      newPerspectives: '&id,dataId',
      updates: '&id,perspectiveId,timexstamp,dataId',
      deletedPerspectives: '&id',
    });

    this.perspectives = this.table('perspectives');
    this.newPerspectives = this.table('newPerspectives');
    this.updates = this.table('updates');
    this.deletedPerspectives = this.table('deletedPerspectives');
  }
}
