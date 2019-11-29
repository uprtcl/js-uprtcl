import {TemplateResult} from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

export interface Lens {
  name: string;
  render: (lensContent: TemplateResult) => TemplateResult;
}

export interface LensElement<P> {
  data: P;
  editable?: boolean;
}

export interface Isomorphisms {
  entity: Hashed<object>;
  isomorphisms: Array<any>;
}
