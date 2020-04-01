import { Lens } from '../types';

export interface HasLenses {
  lenses: (entity: any) => Lens[];
}
