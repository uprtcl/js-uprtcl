import { TemplateResult } from 'lit-element';

export interface Lens {
  name: string;
  render: (entityLink: string, context: any) => TemplateResult;
  type?: string;
}

export type LensSelector = (
  lenses: Lens[],
  entityLink: string,
  entity: any,
  lensType: string,
  context: string
) => Lens;
