import { TemplateResult } from 'lit-element';
import { Behaviour, Evees } from '@uprtcl/evees';

export interface Lens<T = string> {
  name: string;
  type?: string;
  render: (input: T, evees?: Evees) => TemplateResult;
}

export interface HasLenses<O, I = string> extends Behaviour<O> {
  lenses: (object: O) => Lens<I>[];
}
