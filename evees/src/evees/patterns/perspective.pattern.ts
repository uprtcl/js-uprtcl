import { Entity } from '../../cas/interfaces/entity';
import { Pattern } from '../../patterns/interfaces/pattern';
import { Signed } from '../../patterns/interfaces/signable';
import { extractSignedEntity } from '../../uprtcl-evees';

import { Perspective } from '../interfaces/types';

export const PerspectiveType = 'Uprtcl:Commit';
export const propertyOrder = ['creatorId', 'path', 'remote', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = PerspectiveType;
}
