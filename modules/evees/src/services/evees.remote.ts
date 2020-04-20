import { Authority, AccessControlService } from '@uprtcl/access-control';

import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';

export interface EveesRemote extends EveesProvider, Authority {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalsProvider | undefined;
}
