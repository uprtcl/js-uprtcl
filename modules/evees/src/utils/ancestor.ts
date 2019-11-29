import { Secured } from '@uprtcl/common';

import { Evees } from '../services/evees';
import { Commit } from '../types';

export const isAncestorOf = (evees: Evees) => async (
  ancestorId: string,
  commitId: string
): Promise<boolean> => {
  if (ancestorId === commitId) return true;

  const commit: Secured<Commit> | undefined = await evees.get(commitId);

  if (!commit) throw new Error(`Could not fetch commit with id ${commitId} from any source`);

  const parentsIds = commit.object.payload.parentsIds;

  if (parentsIds.includes(ancestorId)) {
    return true;
  } else {
    /** recursive call */
    for (let ix = 0; ix < parentsIds.length; ix++) {
      if (await isAncestorOf(evees)(ancestorId, parentsIds[ix])) {
        return true;
      }
    }
  }

  return false;
};
