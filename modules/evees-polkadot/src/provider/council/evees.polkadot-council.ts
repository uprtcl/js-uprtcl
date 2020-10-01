import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PolkadotConnection } from '../connection.polkadot';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  deriveSecured,
  hashObject
} from '@uprtcl/evees';

import { EveesAccessControlPolkadot } from '../evees-acl.polkadot';
import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalsPolkadotCouncil } from './evees.polkadot-council.proposals';

const evees_if = 'evees-council';

export class EveesPolkadotCouncil implements EveesRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlPolkadot;
  proposals: ProposalsPolkadotCouncil;

  councilStorage: PolkadotCouncilEveesStorage;

  constructor(public connection: PolkadotConnection, public store: CASStore) {
    this.accessControl = new EveesAccessControlPolkadot(store);
    this.councilStorage = new PolkadotCouncilEveesStorage(connection, store, {
      duration: 10,
      quorum: 0.2,
      thresehold: 0.5
    });
    this.proposals = new ProposalsPolkadotCouncil(connection, this.councilStorage, store);
  }

  get id() {
    return `polkadot-${this.connection.getNetworkId()}:${evees_if}`;
  }

  get defaultPath() {
    return '';
  }

  get userId() {
    return this.connection.account;
  }

  async ready(): Promise<void> {
    await Promise.all([this.store.ready(), this.councilStorage.ready()]);
  }

  async canWrite(uref: string) {
    /** no one can directly update a council governed perspective */
    return false;
  }

  async updatePerspective(perspectiveId: string, details: PerspectiveDetails) {
    throw new Error('cant create perspective directly. Need to create a proposal.');
  }

  async snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string
  ): Promise<Secured<Perspective>> {
    const creatorId = this.userId ? this.userId : '';
    timestamp = timestamp ? timestamp : Date.now();

    const defaultContext = await hashObject({
      creatorId,
      timestamp
    });

    context = context || defaultContext;

    const object: Perspective = {
      creatorId,
      remote: this.id,
      path: path !== undefined ? path : this.defaultPath,
      timestamp,
      context
    };

    const perspective = await deriveSecured<Perspective>(object, this.store.cidConfig);

    perspective.casID = this.store.casID;

    return perspective;
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    throw new Error('cant create perspective directly. Need to create a proposal.');
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    throw new Error('cant create perspective directly. Need to create a proposal.');
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    // TODO: add context to updates in proposals
    return [];
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.councilStorage.getPerspective(perspectiveId);
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async isLogged() {
    return this.userId !== undefined;
  }

  async login(): Promise<void> {
    return;
  }

  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async connect() {}

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
