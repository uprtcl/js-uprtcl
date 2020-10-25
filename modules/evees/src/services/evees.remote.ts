import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';
import { Remote } from '../remote';
import { AccessControlService } from './evees.access-control';
import { Lens } from '@uprtcl/lenses';
import { TemplateResult } from 'lit-element';

export interface EveesRemote extends EveesProvider, Remote {
  accessControl: AccessControlService;
  proposals?: ProposalsProvider;

  canWrite(uref: string): Promise<boolean>;
  lense?(): Lens;
  icon?(): TemplateResult;
}
