import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { PolkadotConnection, UserPerspectives } from './connection.polkadot';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  ProposalsProvider
} from '@uprtcl/evees';

import { EveesAccessControlPolkadot } from './evees-acl.polkadot';
import { Signed } from '@uprtcl/cortex';

const evees_if = 'evees-council';

export class EveesPolkadotCouncil implements EveesRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlPolkadot;
  proposals: ProposalsProvider | undefined;

  constructor(public connection: PolkadotConnection, public store: CASStore) {
    this.accessControl = new EveesAccessControlPolkadot(store);
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
    await Promise.all([this.store.ready()]);
  }

  async canWrite(uref: string) {
    /** no one can directly update a council governed perspective */
    return false;
  }

  async updatePerspective(perspectiveId: string, details: PerspectiveDetails) {
    throw new Error('Method not implemented.');
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    /** perspectives dont need to be created */
    return;
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    /** perspectives dont need to be created */
    return;
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    // TODO: read the latest attestation and look for perspectives with that context?
    return [];
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const attestation = this.connection.getAttestation();    
    return attestation[perspectiveId];
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async isLogged() {
    return false;
  }

  async login(): Promise<void> {
    return;
  }

  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async connect() {
  }

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
