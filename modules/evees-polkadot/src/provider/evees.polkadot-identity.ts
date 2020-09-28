import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';
import { EveesOrbitDBEntities } from '@uprtcl/evees-orbitdb';
import { Signed } from '@uprtcl/cortex';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  ProposalsProvider,
  deriveSecured,
  hashObject,
  EveesHelpers
} from '@uprtcl/evees';

import { PolkadotConnection, UserPerspectivesDetails } from './connection.polkadot';

import { EveesAccessControlPolkadot } from './evees-acl.polkadot';

const evees_if = 'evees-identity';
const EVEES_KEYS = ['evees-cid1', 'evees-cid0'];

export class EveesPolkadotIdentity implements EveesRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlPolkadot;

  constructor(
    public connection: PolkadotConnection,
    protected orbitdbcustom: OrbitDBCustom,
    public store: CASStore,
    public proposals: ProposalsProvider
  ) {
    if (orbitdbcustom.getManifest(EveesOrbitDBEntities.Context) === undefined) {
      throw new Error(
        'orbitdb custom must include the PolkadotEveesOrbitDBEntities.Context stores'
      );
    }
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

  async getUserPerspectivesDetailsHash(userId: string) {
    return this.connection.getHead(userId, EVEES_KEYS);
  }

  async updateUserPerspectivesDetailsHash(head: string) {
    return this.connection.updateHead(head, EVEES_KEYS);
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

  async updateUserPerspectivesDetailsEntry(
    userPerspectivesDetails: UserPerspectivesDetails,
    perspectiveId: string,
    details: PerspectiveDetails
  ) {
    const newUserPerspectiveDetails = { ...userPerspectivesDetails };

    const currentDetails = newUserPerspectiveDetails[perspectiveId];
    // TODO: should this even be checked?
    newUserPerspectiveDetails[perspectiveId] = {
      headId: details.headId ?? currentDetails?.headId
    };

    return newUserPerspectiveDetails;
  }

  // updatePerspectiveDetails?
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails,
    pin: boolean = false
  ) {
    // TODO: move this as an optimization? createPerspective already has this
    const { payload: perspective } = (await this.store.get(perspectiveId)) as Signed<Perspective>;

    let userPerspectivesDetailsHash = await this.getUserPerspectivesDetailsHash(
      perspective.creatorId
    );
    const userPerspectivesDetails = userPerspectivesDetailsHash
      ? ((await this.store.get(userPerspectivesDetailsHash)) as UserPerspectivesDetails)
      : {};

    const userPerspectivesDetailsNew = await this.updateUserPerspectivesDetailsEntry(
      userPerspectivesDetails,
      perspectiveId,
      details
    );

    const userPerspectivesDetailsHashNew = await this.store.create(userPerspectivesDetailsNew);

    await this.updateUserPerspectivesDetailsHash(userPerspectivesDetailsHashNew);
  }

  /** set the parent owner as creatorId (and thus owner) */
  async snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string
  ): Promise<Secured<Perspective>> {
    let parentOwner: string | undefined = undefined;
    if (parentId !== undefined) {
      parentOwner = await this.accessControl.getOwner(parentId);
    }

    const perspective = await EveesHelpers.snapDefaultPerspective(this, parentOwner);
    perspective.casID = this.store.casID;

    return perspective;
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;

    if (this.userId !== secured.object.payload.creatorId) {
      throw new Error(
        `cannot create a perspective whose creatorId ${secured.object.payload.creatorId} is not you`
      );
    }

    const perspectiveId = await this.persistPerspectiveEntity(secured);
    // await this.connection.updateUserPerspectivesDetailsHash()
    await this.updatePerspective(perspectiveId, details, true);

    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context: secured.object.payload.context
      },
      true
    );
    await contextStore.add(perspectiveId);
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    /** check that
     * - all the perspectives are of the same owner
     * - that the canWrite is the that owner if present */

    const owner = newPerspectivesData[0].perspective.object.payload.creatorId;
    // TODO: remove .object. ????
    newPerspectivesData.map(newPerspective => {
      if (newPerspective.perspective.object.payload.creatorId !== owner)
        throw new Error('unexpected creatorId');
      if (newPerspective.canWrite !== undefined && newPerspective.canWrite !== owner)
        throw new Error('unexpected canWrite');
    });

    const userPerspectivesHash = await this.getUserPerspectivesDetailsHash(owner);
    const userPerspectives = userPerspectivesHash
      ? ((await this.store.get(userPerspectivesHash)) as UserPerspectivesDetails)
      : {};

    let userPerspectivesNew;

    newPerspectivesData.map(perspectiveData => {
      const secured = perspectiveData.perspective;
      const details = perspectiveData.details;
      userPerspectivesNew = this.updateUserPerspectivesDetailsEntry(
        userPerspectives,
        secured.id,
        details
      );
    });

    const userPerspectivesHashNew = await this.store.create(userPerspectivesNew);

    await this.updateUserPerspectivesDetailsHash(userPerspectivesHashNew);

    await Promise.all(
      newPerspectivesData.map(async perspectiveData => {
        const contextStore = await this.orbitdbcustom.getStore(
          EveesOrbitDBEntities.Context,
          {
            context: perspectiveData.perspective.object.payload.context
          },
          true
        );
        return contextStore.add(perspectiveData.perspective.id);
      })
    );
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    this.logger.log('getContextPerspectives', { context });
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const contextStore = await this.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
      context
    });
    const perspectiveIds = [...contextStore.values()];

    this.logger.log(`[OrbitDB] getContextPerspectives of ${context}`, perspectiveIds);

    this.logger.log('getContextPerspectives - done ', {
      context,
      perspectiveIds
    });
    return perspectiveIds;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const { payload: perspective } = (await this.store.get(perspectiveId)) as Signed<Perspective>;
    const userPerspectivesDetailsHash = await this.getUserPerspectivesDetailsHash(
      perspective.creatorId
    );
    const userPerspectivesDetails = userPerspectivesDetailsHash
      ? ((await this.store.get(userPerspectivesDetailsHash)) as UserPerspectivesDetails)
      : {};

    return userPerspectivesDetails[perspectiveId];
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
