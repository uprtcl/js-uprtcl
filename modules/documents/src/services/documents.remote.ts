import { SourceProvider } from '@uprtcl/cortex';

import { DocumentsProvider } from './documents.provider';

export interface DocumentsRemote extends DocumentsProvider, SourceProvider {}
