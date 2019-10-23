import { Lens } from '../../types';

export interface HasLenses {
  getLenses(object?: any): Lens[];
}
