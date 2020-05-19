import { TemplateResult } from 'lit-element';

import { DocNodeEventsHandlers, DocNode, TextNode } from '../types';
import { Entity } from '@uprtcl/cortex';

export interface DocNodeLens {
  name: string;
  render: (node: DocNode, eventHandlers: DocNodeEventsHandlers) => TemplateResult;
  type?: string;
}

export interface HasDocNodeLenses {
  docNodeLenses: (node?: Entity<TextNode>) => DocNodeLens[];
}
