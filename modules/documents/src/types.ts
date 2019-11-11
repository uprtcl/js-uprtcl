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
  DocumentsProvider: Symbol('documents-provider'),
  DocumentsCache: Symbol('documents-cache'),
  TextNodePattern: Symbol('text-node-pattern')
};

export type DocumentsLocal = CacheService & DocumentsProvider;
