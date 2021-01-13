import {
  Pattern,
  Entity,
  Signed,

import { Perspective } from '../interfaces/types';
import { extractSignedEntity } from '../../cas/utils/signed';

export const PerspectiveType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorId', 'path', 'remote', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = PerspectiveType;
}
