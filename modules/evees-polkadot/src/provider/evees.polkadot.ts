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
    return `eth-${this.connection.getNetworkId()}:${evees_if}`;
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

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    
    const owner = await this.getOwnerOfNewPerspective(perspectiveData);

    /** all perspectives **of this user** are stored under one ipfs hash */
    const userPerspectivesHash = await this.getUserPerspectives(owner);
    const userPerspectives = await this.store.get(userPerspectivesHash);

    userPerspectives[perspectiveId] = { 
      headId: details.headId, 
      context: details.context 
    }

    const userPerspectivesHashNew = await await this.store.create(userPerspectives)

    const headCidParts = cidToHex32(userPerspectivesHashNew);
    
    set evees_1 entry on user identity to headCidParts[1]
    set evees_0 entry on user identity to headCidParts[0]

    that's it! perspective created!
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    const ethPerspectivesData = await this.preparePerspectives(
      newPerspectivesData
    );

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.uprtclDetails.send(INIT_PERSP_BATCH, [
      ethPerspectivesData,
      this.ethConnection.getCurrentAccount(),
    ]);
  }

  /**
   * @override
   */
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [
      perspectiveId,
    ]);

    if (details.context !== undefined) {
      await this.uprtclDetails.send(UPDATE_PERSP_DETAILS, [
        perspectiveIdHash,
        details.context ? details.context : '',
      ]);
    }

    if (details.headId !== undefined) {
      const headCidParts = cidToHex32(details.headId);

      await this.uprtclRoot.send(UPDATED_HEAD, [
        perspectiveIdHash,
        headCidParts[0],
        headCidParts[1],
        ZERO_ADDRESS,
      ]);
    }
  }

  async hashToId(hash: string) {
    return hashToId(this.uprtclRoot, hash);
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
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [
      perspectiveId,
    ]);

    const context = await getEthPerspectiveContext(
      this.uprtclDetails.contractInstance,
      perspectiveIdHash
    );
    const ethPerspective = await getEthPerspectiveHead(
      this.uprtclRoot.contractInstance,
      perspectiveIdHash
    );

    const headId =
      ethPerspective !== undefined
        ? bytes32ToCid([ethPerspective.headCid1, ethPerspective.headCid0])
        : undefined;

    return { name: '', context, headId };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [
      perspectiveId,
    ]);
    let contextHash = ZERO_HEX_32;

    /** set null values */
    await this.uprtclDetails.send(UPDATE_PERSP_DETAILS, [
      perspectiveIdHash,
      contextHash,
      '',
      '',
      '',
    ]);

    /** set null owner (cannot be undone) */
    const ZERO_ADD = '0x' + new Array(40).fill(0).join('');
    await this.uprtclRoot.send(UPDATE_OWNER, [perspectiveIdHash, ZERO_ADD]);
  }

  async isLogged() {
    return this.ethConnection.canSign();
  }
  async login(): Promise<void> {
    await this.ethConnection.connectWallet();
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
