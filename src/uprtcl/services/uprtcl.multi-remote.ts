import { UprtclService } from './uprtcl.service';
import { MultiRemoteService } from '../../discovery/multi/multi-remote.service';
import { Context, Perspective, Commit } from '../types';
import { Secured } from '../../patterns/derive/secured.pattern';
import { Source } from '../../discovery/sources/source';

export class UprtclMultiRemote implements UprtclService {
  constructor(
    protected source: Source,
    protected multiRemotes: MultiRemoteService<UprtclService>
  ) {}

  get<T extends object>(hash: string): Promise<T | undefined> {
    return this.source.get(hash);
  }
  createContext(context: Context): Promise<string> {
    throw new Error('Method not implemented.');
  }
  createPerspective(perspective: Perspective): Promise<string> {
    throw new Error('Method not implemented.');
  }

  createCommitIn(commit: Commit, source: string): Promise<string> {
    return this.multiRemotes.create(commit, service => service.createCommit(commit), source);
  }

  createCommit(commit: Commit): Promise<string> {
    return this.multiRemotes.create(
      commit,
      service => service.createCommit(commit),
      this.defaultRemote
    );
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
}
