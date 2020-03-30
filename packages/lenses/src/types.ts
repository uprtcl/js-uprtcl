import { TemplateResult } from 'lit-element';

export interface Lens {
  name: string;
  render: (context: any) => TemplateResult;
  type?: string;
}
