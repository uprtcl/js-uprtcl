import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals';
import { Remote } from '../remote';
import { AccessControlService } from './access-control';
import { Lens } from '@uprtcl/lenses';
import { TemplateResult } from 'lit-element';
import { Perspective } from '../types';
import { Secured } from '../utils/cid-hash';

export interface EveesRemote extends EveesProvider, Remote {
  accessControl: AccessControlService;
  proposals?: ProposalsProvider;

  canUpdate(uref: string): Promise<boolean>;
  lense?(): Lens;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
