import { Behaviour } from '@uprtcl/cortex';
import { Lens } from '../types';

export interface HasLenses<O> extends Behaviour<O> {
  lenses: (object: O) => Lens[];
}
