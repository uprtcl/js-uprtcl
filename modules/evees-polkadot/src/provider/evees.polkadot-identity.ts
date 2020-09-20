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

const evees_if = 'evees-identity';

export class EveesPolkadotIdentity implements EveesRemote {
  logger: Logger = new Logger('EveesEtereum');

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

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.store.create(secured.object);
    this.logger.log(`[ETH] persistPerspectiveEntity - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    return perspectiveId;
  }

  async canWrite(uref: string) {
    return this.userId ? this.accessControl.canWrite(uref, this.userId) : false;
  }

  /** */
  async getOwnerOfNewPerspective(perspectiveData: NewPerspectiveData) {
    let owner: String | undefined = undefined;
    if (perspectiveData.parentId !== undefined) {
      owner = await this.accessControl.getOwner(perspectiveData.parentId);
    } else {
      owner =
        perspectiveData.canWrite !== undefined ? perspectiveData.canWrite : this.connection.account;
    }
    return owner;
  }

  async updateUserPerspectivesEntry(
    userPerspectives: UserPerspectives,
    perspectiveId: string,
    details: PerspectiveDetails
  ) {
    const currentDetails = userPerspectives[perspectiveId];

    userPerspectives[perspectiveId] = {
      headId:
        details.headId !== undefined
          ? details.headId
          : currentDetails !== undefined
          ? currentDetails.headId
          : undefined,
      context:
        details.context !== undefined
          ? details.context
          : currentDetails !== undefined
          ? currentDetails.context
          : undefined
    };

    return userPerspectives;
  }

  async updatePerspective(perspectiveId: string, details: PerspectiveDetails) {
    const perspective = (await this.store.get(perspectiveId)) as Signed<Perspective>;
    let userPerspectivesHash = await this.connection.getUserPerspectivesHash(
      perspective.payload.creatorId
    );
    // if (!userPerspectivesHash) {
    //   userPerspectivesHash = await
    // }
    const userPerspectives = (await this.store.get(userPerspectivesHash)) as UserPerspectives;

    const userPerspectivesNew = this.updateUserPerspectivesEntry(
      userPerspectives,
      perspectiveId,
      details
    );

    const userPerspectivesHashNew = await this.store.create(userPerspectivesNew);

    await this.connection.updateUserPerspectivesHash(userPerspectivesHashNew);
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;

    const perspectiveId = await this.persistPerspectiveEntity(secured);

    const owner = await this.getOwnerOfNewPerspective(perspectiveData);
    if (owner !== secured.object.payload.creatorId) {
      throw new Error(
        `cannot create a perspective whose owner ${owner} is not the creatorId ${secured.object.payload.creatorId}`
      );
    }
    //TODO: store hash perspectiveID in profile
    await this.connection.updateUserPerspectivesHash(perspectiveId);

    // await this.updatePerspective(perspectiveId, details);
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    /** check that
     * - all the perspectives are of the same owner
     * - that the canWrite is the that owner if present and
     * - that the parentId owner is that owner if present */

    const owner = newPerspectivesData[0].perspective.object.payload.creatorId;
    newPerspectivesData.map(newPerspective => {
      if (newPerspective.perspective.object.payload.creatorId !== owner)
        throw new Error('unexpected creatorId');
      if (newPerspective.canWrite !== undefined && newPerspective.canWrite !== owner)
        throw new Error('unexpected canWrite');
    });

    const userPerspectivesHash = await this.connection.getUserPerspectivesHash(owner);
    const userPerspectives = (await this.store.get(userPerspectivesHash)) as UserPerspectives;

    let userPerspectivesNew;

    newPerspectivesData.map(perspectiveData => {
      const secured = perspectiveData.perspective;
      const details = perspectiveData.details;
      userPerspectivesNew = this.updateUserPerspectivesEntry(userPerspectives, secured.id, details);
    });

    const userPerspectivesHashNew = await this.store.create(userPerspectivesNew);

    await this.connection.updateUserPerspectivesHash(userPerspectivesHashNew);
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return [];
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const perspective = (await this.store.get(perspectiveId)) as Secured<Perspective>;
    const userPerspectivesHash = await this.connection.getUserPerspectivesHash(
      perspective.object.payload.creatorId
    );
    const userPerspectives = (await this.store.get(userPerspectivesHash)) as UserPerspectives;

    return userPerspectives[perspectiveId];
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
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

  async connect() {}

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
