import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';
import { Remote } from '../remote';
import { AccessControlService } from './evees.access-control';

export interface EveesRemote extends EveesProvider, Remote {
  accessControl?: AccessControlService;
  proposals?: ProposalsProvider;
}
