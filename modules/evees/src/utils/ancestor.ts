import { Entity, Signed } from '@uprtcl/cortex';
import { Client } from '../services/client';
import { Commit } from '../types';

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
