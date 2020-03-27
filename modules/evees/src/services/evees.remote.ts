import { Authority, CASSource } from '@uprtcl/multiplatform';
import { AccessControlService } from '@uprtcl/access-control';

import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';

export interface EveesRemote extends EveesProvider, Authority, CASSource {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalsProvider | undefined;
}
