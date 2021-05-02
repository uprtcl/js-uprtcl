import Dexie from 'dexie';
import { Entity } from '../../interfaces/entity';
import { PerspectiveDetails } from '../../interfaces/types';

export interface PerspectiveLocal {
  id: string;
  onEcosystem?: string[];
  details: PerspectiveDetails;
  levels?: number;
}

// temporary service for documents modile. Should be replaced by a LocalClient with version history.
export class CacheStoreDB extends Dexie {
  perspectives: Dexie.Table<PerspectiveLocal, string>;
  entities: Dexie.Table<Entity, string>;

  constructor(prefix: string = 'client-local') {
    super(`${prefix}-evees-store`);

    this.version(0.1).stores({
      perspectives: '&id,context,*onEcosystem,*children,dataId',
      entities: '&id',
    });

    this.perspectives = this.table('perspectives');
    this.entities = this.table('entities');
  }
}
