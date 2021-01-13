import {
  Entity,
  Signed,
} from 'src/creator-helpers/node_modules/src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';
import { Client } from '../interfaces/client';
import { Commit } from '../interfaces/types';

export const isAncestorOf = (client: Client) => async (
  ancestorId: string,
  commitId: string
): Promise<boolean> => {
  if (ancestorId === commitId) return true;

  const commit: Entity<Signed<Commit>> = await client.store.getEntity(commitId);
  const parentsIds = commit.object.payload.parentsIds;

  if (parentsIds.includes(ancestorId)) {
    return true;
  } else {
    /** recursive call */
    for (let ix = 0; ix < parentsIds.length; ix++) {
      if (await isAncestorOf(client)(ancestorId, parentsIds[ix])) {
        return true;
      }
    }
  }

  return false;
};
