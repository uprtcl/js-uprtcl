import { CondensateCommits } from './condensate.commits';
import { Update } from '../interfaces/types';
import { EntityResolver } from '../interfaces/entity.resolver';

export const condensateUpdates = async (
  updates: Update[],
  entityResolver: EntityResolver
): Promise<Update[]> => {
  interface UpdateGroup {
    orgUpdates: Update[];
    eqUpdate?: Update;
  }

  const updatesPerPerspective: Map<string, UpdateGroup> = new Map();

  updates.forEach((update) => {
    const group = updatesPerPerspective.get(update.perspectiveId) || {
      orgUpdates: [],
    };
    group.orgUpdates.push(update);
    updatesPerPerspective.set(update.perspectiveId, group);
  });

  await Promise.all(
    Array.from(updatesPerPerspective.entries()).map(async ([perspectiveId, group]) => {
      const condensate = new CondensateCommits(entityResolver, group.orgUpdates, false);
      await condensate.init();
      const eqUpdates = await condensate.condensate();
      if (eqUpdates.length !== 1) {
        throw new Error('update group has multiple heads');
      }
      group.eqUpdate = eqUpdates[0];
      updatesPerPerspective.set(perspectiveId, group);
    })
  );

  return Array.from(updatesPerPerspective.values()).map((group) => group.eqUpdate as Update);
};
