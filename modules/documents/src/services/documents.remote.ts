import { SourceProvider } from '@uprtcl/multiplatform';

import { DocumentsProvider } from './documents.provider';

export interface DocumentsRemote extends DocumentsProvider, SourceProvider {}
