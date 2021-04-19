import { Signed } from '../../patterns/interfaces/signable';
import { CASStore } from '../../cas/interfaces/cas-store';
import { Commit, EveesMutation, Update } from '../interfaces/types';

export const getUpdateEntitiesIds = async (update: Update, store: CASStore): Promise<string[]> => {
  const entitiesIds: string[] = [];
  entitiesIds.push(update.perspectiveId);

  if (update.details.headId) {
    const head = await store.getEntity<Signed<Commit>>(update.details.headId);
    entitiesIds.push(update.details.headId);
    entitiesIds.push(head.object.payload.dataId);
  }

  return entitiesIds;
};

/** get all the entities that are referenced inside an EveesMutation */
export const getMutationEntitiesIds = async (
  mutation: EveesMutation,
  store: CASStore
): Promise<string[]> => {
  const entitiesIds: Set<string> = new Set();

  await Promise.all(
    mutation.newPerspectives.map(async (newPerspective) => {
      const ids = await getUpdateEntitiesIds(newPerspective.update, store);
      ids.forEach((id) => entitiesIds.add(id));
    })
  );

  await Promise.all(
    mutation.updates.map(async (update) => {
      const ids = await getUpdateEntitiesIds(update, store);
      ids.forEach((id) => entitiesIds.add(id));
    })
  );

  return Array.from(entitiesIds.values());
};
