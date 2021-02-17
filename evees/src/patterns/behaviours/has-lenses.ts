import { TemplateResult } from 'lit-element';
import { Behaviour } from '../interfaces/behaviour';

export interface Lens {
  name: string;
  render: (entity: any, context?: any) => TemplateResult;
  type?: string;
}

export interface HasLenses<O> extends Behaviour<O> {
  lenses: (object: O) => Lens[];
}
