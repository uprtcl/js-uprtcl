import { TemplateResult } from 'lit-element';

import { DocNodeEventsHandlers, DocNode } from '../types';

export interface DocNodeLens {
    name: string;
    render: (node: DocNode, eventHandlers: DocNodeEventsHandlers) => TemplateResult;
    type?: string;
  }
  

export interface HasDocNodeLenses {
  docNodeLenses: (node: DocNode) => DocNodeLens[];
}
