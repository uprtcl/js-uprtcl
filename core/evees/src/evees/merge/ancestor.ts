import { Signed } from '../../patterns/interfaces/signable';

import { Client } from '../interfaces/client';
import { Entity } from '../interfaces/entity';
import { Commit } from '../interfaces/types';

export const isAncestorOf = (client: Client) => async (
  ancestorId: string,
  commitId: string
): Promise<boolean> => {
  if (ancestorId === commitId) return true;

  const commit: Entity<Signed<Commit>> = await client.getEntity(commitId);
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
