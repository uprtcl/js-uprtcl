import { SourceProvider } from '@uprtcl/cortex';
import { AccessControlService } from '@uprtcl/access-control';

import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';

export interface EveesRemote extends EveesProvider, SourceProvider {
  /** Access Control */
  accessControl: AccessControlService<any> | undefined;

  /** Proposals */
  proposals: ProposalsProvider | undefined;
}
