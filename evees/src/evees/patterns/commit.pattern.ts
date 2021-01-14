import { Entity } from '../../cas/interfaces/entity';
import { Pattern } from '../../patterns/interfaces/pattern';
import { Signed } from '../../patterns/interfaces/signable';
import { extractSignedEntity } from '../../cas/utils/signed';

import { Commit } from '../interfaces/types';

export const CommitType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern extends Pattern<Entity<Signed<Commit>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = CommitType;
}
