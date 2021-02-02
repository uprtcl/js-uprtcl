import { Entity } from '../../cas/interfaces/entity';
import { Pattern } from '../../patterns/interfaces/pattern';
import { Signed } from '../../patterns/interfaces/signable';

import { Commit } from '../interfaces/types';

export const CommitType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern extends Pattern<Entity<Signed<Commit>>> {
  recognize(object: any) {
    return object.payload && propertyOrder.every((p) => object.payload.hasOwnProperty(p));
  }

  type = CommitType;
}
