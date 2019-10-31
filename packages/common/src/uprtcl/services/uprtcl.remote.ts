import { NamedSource } from '@uprtcl/cortex';

import { UprtclProvider } from './uprtcl.provider';
import { AccessControlService } from '../../access-control/services/access-control.service';
import { ProposalProvider } from './proposal.provider';

export interface UprtclRemote extends UprtclProvider, NamedSource {
  /** Access Control */
  accessControl: AccessControlService | undefined;

  /** Proposals */
  proposals: ProposalProvider | undefined;
}
