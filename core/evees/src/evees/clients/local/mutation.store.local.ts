import { IndexDataHelper } from 'src/evees/index.data.helper';
import { getUpdateEntitiesHashes } from 'src/evees/utils/mutation.entities';
import { Logger } from '../../../utils/logger';
import {
  NewPerspective,
  Update,
  EveesMutation,
  SearchOptions,
  ClientMutationStore,
  EntityResolver,
  PerspectiveDetails,
  LinksType,
  EntityRemote,
  Entity,
} from '../../interfaces/index';
import { MutationStoreDB, NewPerspectiveLocal, UpdateLocal } from './mutation.store.local.db';

/** use local storage as cache of ClientCachedWithBase.
 * Persist entities on an EntityRemote (most likely also local)
 * so that entities are available to the EntityResolver. */
export class MutationStoreLocal implements ClientMutationStore {
  logger = new Logger('CacheLocal');

  readonly db: MutationStoreDB;

  constructor(
    name: string,
    protected entityResolver: EntityResolver,
    protected entityRemote: EntityRemote
  ) {
    this.db = new MutationStoreDB(name);
  }

  getDeletedPerspectives(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  clearPerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails | undefined> {
    const perspective = await this.db.perspectivesDetails.get({
      perspectiveId,
    });
    return perspective ? perspective.details : undefined;
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.db.newPerspectives.put({
      perspectiveId: newPerspective.perspective.hash,
      newPerspective,
    });

    await this.entityRemote.persistEntity(newPerspective.perspective);
    await this.persistUpdateEntities(newPerspective.update);

    await this.updateDetails(newPerspective.update);
  }

  async addUpdate(update: Update): Promise<void> {
    await this.persistUpdateEntities(update);

    await this.db.updates.put({
      id: this.getUpdateId(update),
      perspectiveId: update.perspectiveId,
      update,
    });

    await this.updateDetails(update);
  }

  private getUpdateId(update: Update) {
    return update.perspectiveId + update.details.headId;
  }

  async persistUpdateEntities(update: Update): Promise<void> {
    const entitiesHashes = await getUpdateEntitiesHashes(update, this.entityResolver);
    const entities = await this.entityResolver.getEntities(entitiesHashes);
    await this.entityRemote.persistEntities(entities);
  }

  async updateDetails(update: Update) {
    const onEcosystemChanges = IndexDataHelper.getArrayChanges(
      update.indexData,
      LinksType.onEcosystem
    );

    /** keep the latest details cached */
    await this.db.perspectivesDetails.put({
      perspectiveId: update.perspectiveId,
      details: update.details,
      onEcosystem: onEcosystemChanges.added,
    });
  }

  async deletedPerspective(perspectiveId: string) {
    await this.db.deletedPerspectives.put(perspectiveId);
  }

  async deleteNewPerspective(perspectiveId: string) {
    if ((await this.db.newPerspectives.get(perspectiveId)) !== undefined) {
      return this.db.newPerspectives.delete(perspectiveId);
    }
  }

  /** helper method to avoid code duplication */
  private async getFiltered<T>(under: string[], table: Dexie.Table) {
    let elements: T[] = [];
    if (under && under.length > 0) {
      const allElements = await Promise.all(
        under.map((underId) => {
          return table.where('perspectiveId').equals(underId).toArray();
        })
      );
      elements = Array.prototype.concat.apply([], allElements);
    } else {
      elements = await table.toArray();
    }

    return elements;
  }

  async getNewPerspectives(under: string[] = []): Promise<NewPerspective[]> {
    const local = await this.getFiltered<NewPerspectiveLocal>(under, this.db.newPerspectives);
    return local.map((local) => local.newPerspective);
  }

  async getUpdates(under: string[] = []): Promise<Update[]> {
    const local = await this.getFiltered<UpdateLocal>(under, this.db.updates);
    return local.map((local) => local.update);
  }

  async getDeletedPerspective(under: string[] = []): Promise<string[]> {
    const local = await this.getFiltered<string>(under, this.db.deletedPerspectives);
    return local;
  }

  async diff(options?: SearchOptions): Promise<EveesMutation> {
    let of: string[] = [];

    /** filter updates only to perspectives under a given element */
    if (options && options.under) {
      /**  */
      const allUnder = await Promise.all(
        options.under.elements.map(
          async (under): Promise<string[]> => {
            return this.getUnder(under.id);
          }
        )
      );
      of = Array.prototype.concat.apply([], allUnder);
    }

    const mutation: EveesMutation = {
      newPerspectives: await this.getNewPerspectives(of),
      updates: await this.getUpdates(of),
      deletedPerspectives: await this.getDeletedPerspective(of),
    };

    return mutation;
  }

  async getUnder(uref: string): Promise<string[]> {
    return this.db.perspectivesDetails.where('onEcosystem').equals(uref).primaryKeys();
  }

  async getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined> {
    const newPerspectiveLocal = await this.db.newPerspectives.get(perspectiveId);
    if (!newPerspectiveLocal) return undefined;
    return newPerspectiveLocal.newPerspective;
  }

  async getUpdatesOf(perspectiveId: string): Promise<Update[]> {
    const updates = await this.db.updates.where('perspectiveId').equals(perspectiveId).toArray();
    return updates.map((u) => u.update);
  }

  async clear(diff?: EveesMutation): Promise<void> {
    if (diff) {
      await this.db.transaction(
        'rw',
        this.db.newPerspectives,
        this.db.updates,
        this.db.deletedPerspectives,
        this.db.perspectivesDetails,
        async () => {
          await Promise.all(
            diff.newPerspectives.map(async (np) => {
              await this.db.newPerspectives
                .where('perspectiveId')
                .equals(np.perspective.hash)
                .delete();
              await this.db.perspectivesDetails
                .where('perspectiveId')
                .equals(np.perspective.hash)
                .delete();
            })
          );
          await Promise.all(
            diff.updates.map(async (up) => {
              await this.db.updates.where('id').equals(this.getUpdateId(up)).delete();
              await this.db.perspectivesDetails
                .where('perspectiveId')
                .equals(up.perspectiveId)
                .delete();
            })
          );
          await Promise.all(
            diff.deletedPerspectives.map(async (id) => {
              await this.db.deletedPerspectives.where('perspectiveId').equals(id).delete();
              await this.db.perspectivesDetails.where('perspectiveId').equals(id).delete();
            })
          );
        }
      );
    } else {
      await Promise.all([
        this.db.newPerspectives.clear(),
        this.db.updates.clear(),
        this.db.deletedPerspectives.clear(),
        this.db.perspectivesDetails.clear(),
      ]);
    }
  }
}
