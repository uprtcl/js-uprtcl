import { IndexDataHelper } from '../../index.data.helper';
import { Signed } from '../../../patterns/';
import { Logger } from '../../../utils';
import { snapDefaultPerspective } from '../../default.perspectives';

import {
  AccessControl,
  ClientExplore,
  ClientRemote,
  EntityRemote,
  EntityResolver,
  EveesMutationCreate,
  GetPerspectiveOptions,
  LinksType,
  NewPerspective,
  PartialPerspective,
  Perspective,
  PerspectiveGetResult,
  SearchOptions,
  SearchResult,
  Secured,
  Update,
} from '../../interfaces';
import { Proposals } from '../../proposals/proposals';

import { LocalAccessControl } from './access.control.local';
import { EntityRemoteLocal } from './entity.remote.local';
import { LocalExplore } from './perspectives.explore.local';
import { PerspectivesStoreDB } from './perspectives.store.db';
import { LOCAL_REMOTE_ID } from './access.control.local';

const LOGINFO = false;

export class ClientRemoteLocal implements ClientRemote {
  logger = new Logger('ClientCachedWithBase');

  id: string;
  defaultPath: string = '';

  entityRemote: EntityRemote;
  accessControl: AccessControl;

  db: PerspectivesStoreDB;
  exploreService: ClientExplore;
  proposals!: Proposals;

  constructor(
    readonly entityResolver: EntityResolver,
    db?: PerspectivesStoreDB,
    entityRemote?: EntityRemote,
    exploreService?: LocalExplore,
    id: string = LOCAL_REMOTE_ID
  ) {
    this.entityRemote = entityRemote || new EntityRemoteLocal();
    this.db = db || new PerspectivesStoreDB();
    this.exploreService = exploreService || new LocalExplore(db);
    this.accessControl = new LocalAccessControl(this.entityResolver);
    this.id = id;
  }

  async ready() {}

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
  }

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const perspectiveLocal = await this.db.perspectivesDetails.get(perspectiveId);
    const details = perspectiveLocal ? perspectiveLocal.details : {};
    return { details: { ...details, canUpdate: true } };
  }

  async update(mutation: EveesMutationCreate): Promise<void> {
    if (LOGINFO) this.logger.log(`update()`, { mutation });

    if (mutation.entities) {
      await this.entityRemote.persistEntities(mutation.entities);
    }

    if (mutation.newPerspectives) {
      await this.updatePerspectives(mutation.newPerspectives.map((np) => np.update));
    }

    if (mutation.updates) {
      await this.updatePerspectives(mutation.updates);
    }

    if (mutation.deletedPerspectives) {
      await this.deletePerspectives(mutation.deletedPerspectives);
    }
  }

  async updatePerspectives(updates: Update[]): Promise<void> {
    // DB transaction?
    await Promise.all(
      updates.map(async (update) => {
        const perspective = await this.entityResolver.getEntity<Signed<Perspective>>(
          update.perspectiveId
        );

        const onEcosystem = update.indexData
          ? update.indexData.onEcosystem
            ? update.indexData.onEcosystem
            : []
          : [];

        const children = update.indexData
          ? update.indexData.links
            ? update.indexData.links.children
            : []
          : [];

        return this.db.perspectivesDetails.put({
          perspectiveId: update.perspectiveId,
          details: update.details,
          context: perspective.object.payload.context,
          onEcosystem: onEcosystem,
          children,
        });
      })
    );
  }

  async updatePerspective(update: Update): Promise<void> {
    return this.updatePerspectives([update]);
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.updatePerspectives([newPerspective.update]);
  }

  async deletePerspectives(perspectiveIds: string[]): Promise<void> {
    await Promise.all(perspectiveIds.map((id) => this.db.perspectivesDetails.delete(id)));
  }

  deletePerspective(perspectiveId: string): Promise<void> {
    return this.db.perspectivesDetails.delete(perspectiveId);
  }

  canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions | undefined
  ): Promise<SearchResult> {
    return this.exploreService.explore(searchOptions, fetchOptions);
  }

  clearExplore(searchOptions: SearchOptions, fetchOptions?: GetPerspectiveOptions): Promise<void> {
    throw new Error('Method not implemented.');
  }

  userId?: string | undefined;

  async connect(): Promise<void> {}
  async isConnected() {
    return true;
  }
  async disconnect() {}
  async isLogged(): Promise<boolean> {
    return true;
  }
  async login() {}
  async logout() {}
}
