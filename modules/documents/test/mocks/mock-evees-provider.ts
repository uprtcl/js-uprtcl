import { Dictionary } from '@uprtcl/micro-orchestrator';
import {
  NewPerspectiveData,
  Perspective,
  Secured,
  Commit,
  PerspectiveDetails,
  EveesRemote,
} from '@uprtcl/evees';

export class MockEveesProvider implements EveesRemote {
  constructor(
    public entities: Dictionary<any> = {},
    public details: Dictionary<PerspectiveDetails> = {}
  ) {}

  isLogged(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  login(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  create(object: object, hash?: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  authority: string = 'local';
  accessControl = undefined;
  proposals = undefined;

  userId = undefined;

  casID: string = 'mock-source';
  cidConfig: any;

  async ready(): Promise<void> {}

  async get(hash: string): Promise<any> {
    return this.entities[hash];
  }

  getContextPerspectives(context: string): Promise<string[]> {
    throw new Error('Method not implemented');
  }

  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.details[perspectiveId];
  }

  cloneAndInitPerspective(newPerspectiveData: NewPerspectiveData): Promise<void> {
    throw new Error('Method not implemented');
  }

  clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    throw new Error('Method not implemented');
  }

  clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    throw new Error('Method not implemented');
  }

  cloneCommit(commit: Secured<Commit>): Promise<void> {
    throw new Error('Method not implemented');
  }

  deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    throw new Error('Method not implemented');
  }
}
