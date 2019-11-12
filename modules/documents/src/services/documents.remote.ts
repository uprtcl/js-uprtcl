import { SourceProvider } from '@uprtcl/cortex';
import { AccessControlService } from '@uprtcl/common';

import { DocumentsProvider } from './documents.provider';

export interface DocumentsRemote extends DocumentsProvider, SourceProvider {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

}
