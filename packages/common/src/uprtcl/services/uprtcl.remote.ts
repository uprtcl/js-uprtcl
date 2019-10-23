import { NamedSource } from '@uprtcl/cortex';

import { UprtclProvider } from './uprtcl.provider';
import { AccessControlService } from '../../access-control/access-control.service';

export interface UprtclRemote extends UprtclProvider, NamedSource {
  accessControlService: AccessControlService;
}
