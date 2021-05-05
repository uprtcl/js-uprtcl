import { Logger } from '../../../utils/logger';
import { NewPerspective, Update, EveesMutation, SearchOptions } from '../../interfaces/types';
import { ClientMutationStore } from '../../interfaces/client.mutation.store';
import { MutationStoreDB, NewPerspectiveLocal, UpdateLocal } from './mutation.store.local.db';
import { getMutationEntitiesHashes } from 'src/evees/utils/mutation.entities';
import { EntityResolver } from 'src/evees/interfaces/entity.resolver';

/** use local storage as cache of ClientCachedWithBase */
export class MutationStoreLocal implements ClientMutationStore {
  logger = new Logger('CacheLocal');

  readonly db: MutationStoreDB;

  constructor(name: string, protected entityResolver: EntityResolver) {
    this.db = new MutationStoreDB(name);
  }

  storeEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getDeletedPerspectives(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  clearPerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.db.newPerspectives.put({
      id: newPerspective.perspective.hash,
      newPerspective,
    });
  }

  async addUpdate(update: Update): Promise<void> {
    await this.db.updates.put({
      id: update.perspectiveId + update.details.headId,
      perspectiveId: update.perspectiveId,
      update,
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
          return table.where('id').equals(underId).toArray();
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
      entitiesHashes: [],
    };

    mutation.entitiesHashes = await getMutationEntitiesHashes(mutation, this.entityResolver);
    return mutation;
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.db.newPerspectives.clear(),
      this.db.updates.clear(),
      this.db.deletedPerspectives.clear(),
      this.db.perspectives.clear(),
    ]);
  }

  async getUnder(uref: string): Promise<string[]> {
    return this.db.perspectives.where('onEcosystem').equals(uref).primaryKeys();
  }

  async getOnEcosystems(perspectiveId: string): Promise<string[]> {
    const perspective = await this.db.perspectives.get(perspectiveId);
    return perspective && perspective.onEcosystem ? perspective.onEcosystem : [];
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
}
