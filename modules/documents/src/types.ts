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
