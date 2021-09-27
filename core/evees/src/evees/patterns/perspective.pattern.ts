import { Pattern } from '../../patterns/interfaces/pattern';
import { Signed } from '../../patterns/interfaces/signable';
import { Entity } from '../interfaces/entity';

import { Perspective } from '../interfaces/types';

export const PerspectiveType = 'Uprtcl:Perspective';
export const propertyOrder = ['creatorId', 'path', 'remote', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(object: any) {
    return object.payload && propertyOrder.every((p) => object.payload.hasOwnProperty(p));
  }

  type = PerspectiveType;
}
