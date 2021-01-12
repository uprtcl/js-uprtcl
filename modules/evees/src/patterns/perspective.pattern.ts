import { Pattern, Entity, Signed } from '@uprtcl/cortex';

import { Perspective } from '../types';
import { extractSignedEntity } from '../utils/signed';

export const PerspectiveType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorId', 'path', 'remote', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = PerspectiveType;
}
