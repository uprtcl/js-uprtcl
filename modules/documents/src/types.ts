import { CacheService } from '@uprtcl/multiplatform';

import { DocumentsProvider } from './services/documents.provider';

export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}

export interface TextNode {
  text: string;
  type: TextType;
  links: string[];
}

export type DocumentsLocal = CacheService & DocumentsProvider;

export const DocumentsTypes = {
  TextNodeEntity: Symbol('text-node-entity'),
  DocumentsLocal: Symbol('documents-local'),
  DocumentsRemote: Symbol('documents-remote'),
  Documents: Symbol('documents')
};
