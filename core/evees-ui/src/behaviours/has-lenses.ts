import { TemplateResult } from 'lit-element';

import { Evees } from '../../../evees/src/evees/evees.service';
import { Behaviour } from '../../../evees/src/patterns/interfaces/behaviour';

export interface Lens<T = string> {
  name: string;
  type?: string;
  render: (input: T, evees?: Evees) => TemplateResult;
}

export interface HasLenses<O, I = string> extends Behaviour<O> {
  lenses: (object: O) => Lens<I>[];
}
