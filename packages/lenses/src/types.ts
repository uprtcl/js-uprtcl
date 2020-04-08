import { TemplateResult } from 'lit-element';
import { Entity } from '@uprtcl/cortex';

export interface Lens {
  name: string;
  render: (entity: Entity<any>, context: any) => TemplateResult;
  type?: string;
}

export type LensSelector = (
  lenses: Lens[],
  entityLink: string,
  entity: any,
  lensType: string,
  context: string
) => Lens;
