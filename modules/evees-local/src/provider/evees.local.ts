import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  EveesHelpers
} from '@uprtcl/evees';

import { CASStoreLocal } from './store.local';
import { EveesAccessControlLocal } from './evees-acl.local';
import { EveesLocalDB } from './evees.local.db';

const evees_if = 'dexie';

export class EveesLocal implements EveesRemote {
  logger: Logger = new Logger('EveesLocal');

  accessControl: EveesAccessControlLocal;
  public db: EveesLocalDB;
  public store: CASStore;

  constructor() {
    this.store = new CASStoreLocal();
    this.db = new EveesLocalDB('evees-local');
    this.accessControl = new EveesAccessControlLocal(this.db);
  }

  get id() {
    return `local:${evees_if}`;
  }

  get defaultPath() {
    return '';
  }

  get userId() {
    return 'local';
  }

  async ready(): Promise<void> {}

  async canWrite(uref: string) {
    return true;
  }

  async updatePerspective(perspectiveId: string, details: PerspectiveDetails) {
    const current = await this.db.perspectives.get(perspectiveId);
    if (!current) throw new Error(`Perspective ${perspectiveId} not found on the dexie`);
    await this.db.perspectives.put({
      id: perspectiveId,
      headId: details.headId,
      context: current.context
    });
  }

  /** set the parent owner as creatorId (and thus owner) */
  async snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string,
    fromPerspectiveId?: string,
    fromHeadId?: string
  ): Promise<Secured<Perspective>> {
    return EveesHelpers.snapDefaultPerspective(
      this,
      undefined,
      context,
      timestamp,
      path,
      fromPerspectiveId,
      fromHeadId
    );
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;

    if (this.userId !== secured.object.payload.creatorId) {
      throw new Error(
        `cannot create a perspective whose creatorId ${secured.object.payload.creatorId} is not you`
      );
    }

    const perspectiveId = await this.store.create(secured.object);
    if (perspectiveId !== secured.id) {
      throw new Error(
        `Unexpected perspective id ${perspectiveId} for perspective ${JSON.stringify(secured)}`
      );
    }

    await this.db.perspectives.put({
      id: perspectiveId,
      context: secured.object.payload.context,
      headId: details.headId,
      fromPerspectiveId: secured.object.payload.fromPerspectiveId
    });
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    for (var newPerspectiveData of newPerspectivesData) {
      await this.createPerspective(newPerspectiveData);
    }
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    const perspectives = await this.db.perspectives
      .where('context')
      .equals(context)
      .toArray();

    const allPerspectivesIds = perspectives.map(e => e.id);

    this.logger.log('getContextPerspectives', {
      context,
      allPerspectivesIds
    });

    return allPerspectivesIds;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const details = await this.db.perspectives.get(perspectiveId);
    return {
      headId: details ? details.headId : undefined
    };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async isLogged() {
    return true;
  }

  async login(userId?: string): Promise<void> {}

  async logout(): Promise<void> {}

  async connect() {}

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
