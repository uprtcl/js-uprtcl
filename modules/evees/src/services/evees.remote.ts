import { NamedSource } from '@uprtcl/cortex';
import { AccessControlService } from '@uprtcl/common';

import { EveesProvider } from './evees.provider';
import { ProposalProvider } from './proposal.provider';

export interface EveesRemote extends EveesProvider, NamedSource {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalProvider | undefined;
}
