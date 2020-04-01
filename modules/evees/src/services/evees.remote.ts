import { Authority, CASSource, CASStore } from '@uprtcl/multiplatform';
import { AccessControlService } from '@uprtcl/access-control';

import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';

export interface EveesRemote extends EveesProvider, Authority, CASStore {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalsProvider | undefined;
}
