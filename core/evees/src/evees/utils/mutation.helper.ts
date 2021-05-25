import { Signed } from '../../patterns/interfaces/signable';
import { EntityResolver } from '../interfaces/entity.resolver';
import { Commit, EveesMutation, Update } from '../interfaces/types';

/** wrapper of statif functions useful to handle EveesMutation */
export class MutationHelper {
  static async getUpdateEntitiesHashes(
    update: Update,
    entityResolver: EntityResolver
  ): Promise<string[]> {
    const entitiesIds: string[] = [];
    entitiesIds.push(update.perspectiveId);

    if (update.details.headId) {
      const head = await entityResolver.getEntity<Signed<Commit>>(update.details.headId);
      entitiesIds.push(update.details.headId);
      entitiesIds.push(head.object.payload.dataId);
    }

    return entitiesIds;
  }

  /** get all the entities that are referenced inside an EveesMutation */
  static async getMutationEntitiesHashes(
    mutation: EveesMutation,
    entityResolver: EntityResolver
  ): Promise<string[]> {
    const entitiesIds: Set<string> = new Set();

    await Promise.all(
      mutation.newPerspectives.map(async (newPerspective) => {
        const ids = await this.getUpdateEntitiesHashes(newPerspective.update, entityResolver);
        ids.forEach((id) => entitiesIds.add(id));
      })
    );

    await Promise.all(
      mutation.updates.map(async (update) => {
        const ids = await this.getUpdateEntitiesHashes(update, entityResolver);
        ids.forEach((id) => entitiesIds.add(id));
      })
    );

    return Array.from(entitiesIds.values());
  }

  static getUpdatesPerPerspective(mutation: EveesMutation): Map<string, Update[]> {
    const updatesPerPerspective = new Map<string, Update[]>();
    mutation.updates.forEach((up) => {
      const updates = updatesPerPerspective.get(up.perspectiveId) || [];
      updates.push(up);
      updatesPerPerspective.set(up.perspectiveId, updates);
    });
    return updatesPerPerspective;
  }
}
