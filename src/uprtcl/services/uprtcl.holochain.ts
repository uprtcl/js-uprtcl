import { UprtclProvider } from './uprtcl.provider';
import { Context, Perspective, Commit } from '../types';
import { HolochainConnection } from '../../connections/holochain.connection';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { Observable } from 'rxjs';

export class UprtclHolochain implements UprtclProvider {
  constructor(
    protected uprtclZome: HolochainConnection,
    protected proxyZome: HolochainConnection
  ) {}

  createContext(context: Context): Promise<Secured<Context>> {
    throw new Error('Method not implemented.');
  }
  createPerspective(perspective: Perspective): Promise<Secured<Perspective>> {
    throw new Error('Method not implemented.');
  }
  createCommit(commit: Commit): Promise<Secured<Commit>> {
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
  getHead(perspectiveId: string): Observable<string | undefined> {
    throw new Error('Method not implemented.');
  }
  get<T extends object>(hash: string): Promise<T | undefined> {
    throw new Error('Method not implemented.');
  }
}
