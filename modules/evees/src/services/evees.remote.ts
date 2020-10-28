import { EveesProvider } from './evees.provider';
import { ProposalsProvider } from './proposals.provider';
import { Remote } from '../remote';
import { AccessControlService } from './evees.access-control';
import { Lens } from '@uprtcl/lenses';
import { TemplateResult } from 'lit-element';
import { Perspective } from '../types';
import { Secured } from '../utils/cid-hash';

export interface EveesRemote extends EveesProvider, Remote {
  accessControl: AccessControlService;
  proposals?: ProposalsProvider;

  canWrite(uref: string): Promise<boolean>;
  lense?(): Lens;
  icon?(): TemplateResult;
  /** a method to derive the id of the default perspective of a user,
   * if user is empty, it returns the default perspective of the remote */
  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
