import { Node } from '@uprtcl/lenses';
import { CacheService } from '@uprtcl/cortex';

import { DocumentsProvider } from './services/documents.provider';

export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}
export interface TypedText {
  text: string;
  type: TextType;
}

export type TextNode = TypedText & Node;

export const DocumentsTypes = {
  Module: Symbol('documents-module'),
  TextNodePattern: Symbol('text-node-pattern'),
  DocumentsLocal: Symbol('documents-local'),
  DocumentsRemote: Symbol('documents-remote'),
  Documents: Symbol('documents'),
};

export type DocumentsLocal = CacheService & DocumentsProvider;
