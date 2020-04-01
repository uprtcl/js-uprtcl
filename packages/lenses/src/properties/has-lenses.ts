import { Lens } from '../types';

export interface HasLenses {
  lenses: (entity: any) => Lens[];
}

export interface HasTopLenses {
  topLenses: (entity: any) => Lens[];
}
