import { Dictionary } from '@uprtcl/micro-orchestrator';
import {
  Perspective,
  Secured,
  Commit,
  PerspectiveDetails,
  EveesRemote,
} from '../../src/uprtcl-evees';
import { NewPerspectiveData } from '../../src/types';

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

  remote: string = 'local';
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

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.details[perspectiveId];
  }

  createPerspective(newPerspectiveData: NewPerspectiveData): Promise<void> {
    throw new Error('Method not implemented');
  }

  createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
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
