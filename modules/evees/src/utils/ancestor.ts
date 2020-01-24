import { Secured } from '../patterns/default-secured.pattern';
import { Source } from '@uprtcl/multiplatform';

import { Commit } from '../types';

export const isAncestorOf = (source: Source) => async (
  ancestorId: string,
  commitId: string
): Promise<boolean> => {
  if (ancestorId === commitId) return true;

  const commit: Secured<Commit> | undefined = await source.get(commitId);

  if (!commit) throw new Error(`Could not fetch commit with id ${commitId} from any source`);

  const parentsIds = commit.object.payload.parentsIds;

  if (parentsIds.includes(ancestorId)) {
    return true;
  } else {
    /** recursive call */
    for (let ix = 0; ix < parentsIds.length; ix++) {
      if (await isAncestorOf(source)(ancestorId, parentsIds[ix])) {
        return true;
      }
    }
  }

  return false;
};
