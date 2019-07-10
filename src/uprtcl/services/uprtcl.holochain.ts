import { UprtclService } from './uprtcl.service';
import { Context, Perspective, Commit, Proof } from '../types';
import { HolochainConnection } from '../../connections/holochain.connection';

export class UprtclHolochain implements UprtclService {
  uprtclZome: HolochainConnection;
  proxyZome: HolochainConnection;

  constructor() {
    this.uprtclZome = new HolochainConnection('test-instance', 'uprtcl');
    this.proxyZome = new HolochainConnection('test-instance', 'proxy');
  }

  get<T extends object>(hash: string): Promise<T | undefined> {
    throw new Error('Method not implemented.');
  }

  createContext(hash: string, context: Context, proof: Proof | undefined): Promise<string> {
    throw new Error('Method not implemented.');
  }
  createPerspective(perspective: Perspective): Promise<string> {
    throw new Error('Method not implemented.');
  }
  createCommit(commit: Commit): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateHead(perspectiveId: string, headId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getHead(perspectiveId: string): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
