import {
  Pattern,
  Entity,
  Signed,

import { Commit } from '../interfaces/types';
import { extractSignedEntity } from '../../cas/utils/signed';

export const CommitType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern extends Pattern<Entity<Signed<Commit>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = CommitType;
}
