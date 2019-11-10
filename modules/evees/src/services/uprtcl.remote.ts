import { NamedSource } from '@uprtcl/cortex';
import { AccessControlService } from '@uprtcl/common';

import { UprtclProvider } from './uprtcl.provider';
import { ProposalProvider } from './proposal.provider';

export interface UprtclRemote extends UprtclProvider, NamedSource {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalProvider | undefined;
}
