import { SourceProvider } from '@uprtcl/cortex';
import { AccessControlService } from '@uprtcl/common';

import { WikisProvider } from './wikis.provider';

export interface WikisRemote extends WikisProvider, SourceProvider {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

}
