import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import {
  PolkadotConnection,
} from './connection.polkadot';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  ProposalsProvider,
} from '@uprtcl/evees';

import { EveesAccessControlPolkadot } from './evees-acl.polkadot';
import { ProposalsPolkadot } from './proposals.polkadot';

const evees_if = 'evees-identity';

export class EveesPolkadot implements EveesRemote, PerspectiveCreator {
  logger: Logger = new Logger('EveesEtereum');

  accessControl: EveesAccessControlPolkadot;
  proposals: ProposalsProvider;

  constructor(
    public connection: PolkadotConnection,
    public store: CASStore
  ) {
    this.accessControl = new EveesAccessControlPolkadot();
    this.proposals = new ProposalsPolkadot();
  }

  get id() {
    return `eth-${this.connection.api}:${evees_if}`;
  }

  get defaultPath() {
    return this.connection.account;
  }

  get userId() {
    return this.connection.account;
  }

  async ready(): Promise<void> {
    await Promise.all([
      this.store.ready(),
    ]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.store.create(secured.object);
    this.logger.log(
      `[ETH] persistPerspectiveEntity - added to IPFS`,
      perspectiveId
    );

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    return perspectiveId;
  }

  async canWrite(uref: string) {
    return this.accessControl.canWrite(uref, this.userId);
  }

  /** */
  async getOwnerOfNewPerspective(perspectiveData: NewPerspectiveData) {
    let owner: String | undefined = undefined;
    if (perspectiveData.parentId !== undefined) {
      owner = await this.accessControl.getOwner(perspectiveData.parentId);
    } else {
      owner =
        perspectiveData.canWrite !== undefined
          ? perspectiveData.canWrite
          : this.connection.account;
    }
    return owner;
  }

  async updatePerspectiveOfOwner(perspectiveId: string, details: PerspectiveDetails) {
    /** all perspectives **of this user** are stored under one ipfs hash */
    const userPerspectivesHash = await this.getUserPerspectives(owner);
    const userPerspectives = await this.store.get(userPerspectivesHash);

    userPerspectives[perspectiveId] = { 
      headId: details.headId, 
      context: details.context 
    }

    const userPerspectivesHashNew = await this.store.create(userPerspectives)

    const headCidParts = cidToHex32(userPerspectivesHashNew);

    set evees_1 entry on user identity to headCidParts[1]
    set evees_0 entry on user identity to headCidParts[0]

    that's it! perspective created!
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    
    const owner = await this.getOwnerOfNewPerspective(perspectiveData);

    this.updatePerspectiveOfOwner(owner);
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    
    .map()
    userPerspectives[perspectiveId] = { 
      headId: details.headId, 
      context: details.context 
    }

  }

  /**
   * @override
   */
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    const perspective = this.store.get(perspectiveId);

    const owner = perspective.object.payload.creatorId
    
    this.updatePerspectiveOfOwner(owner, details);
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    reuse orbitdb
    return perspectiveIds;
  }

  /**
   * @override
   */
  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.getPerspectiveOfOwner(perspectiveId);
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    // TBD
  }

  async isLogged() {
    return this.connection.canSign();
  }
  async login(): Promise<void> {
    await this.connection.connectWallet();
  }
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  connect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  isConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
