import { UprtclService } from './uprtcl.service';
import { Context, Perspective, Commit } from '../types';
import { HolochainConnection } from '../../connections/holochain.connection';
import { Secured } from '../../patterns/derive/secured.pattern';

export class UprtclHolochain implements UprtclService {
  constructor(
    protected uprtclZome: HolochainConnection,
    protected proxyZome: HolochainConnection
  ) {}

  createContext(context: Context): Promise<string> {
    throw new Error('Method not implemented.');
  }
  createPerspective(perspective: Perspective): Promise<string> {
    throw new Error('Method not implemented.');
  }
  createCommit(commit: Commit): Promise<string> {
    throw new Error('Method not implemented.');
  }
  cloneContext(context: Secured<Context>): Promise<string> {
    throw new Error('Method not implemented.');
  }
  clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    throw new Error('Method not implemented.');
  }
  cloneCommit(commit: Secured<Commit>): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateHead(perspectiveId: string, headId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getHead(perspectiveId: string): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  get<T extends object>(hash: string): Promise<T | undefined> {
    throw new Error('Method not implemented.');
  }
}
