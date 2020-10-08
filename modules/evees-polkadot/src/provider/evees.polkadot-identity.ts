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
  EveesHelpers
} from '@uprtcl/evees';

import { PolkadotConnection, UserPerspectivesDetails } from './connection.polkadot';

import { EveesAccessControlPolkadot } from './evees-acl.polkadot';
import { EveesCacheDB } from './evees.cache.db';

const evees_if = 'evees-identity';
const EVEES_KEYS = ['evees-cid1', 'evees-cid0'];

export class EveesPolkadotIdentity implements EveesRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlPolkadot;
  cache: EveesCacheDB;

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
    this.cache = new EveesCacheDB('polkadot-evees-cache');
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

  async getAccounts() {
    await this.connection.getAccounts();
  }

  get accounts() {
    return this.connection.accounts;
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
    const { payload: perspective } = (await this.store.get(perspectiveId)) as Signed<Perspective>;

    // action is done on the cache
    await this.cacheInitialized();

    this.cache.updates.put({
      id: perspectiveId,
      head: details.headId as string
    });
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

    const perspective = await EveesHelpers.snapDefaultPerspective(
      this,
      parentOwner,
      context,
      timestamp,
      path
    );
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
    if (perspectiveId !== secured.id) {
      throw new Error(
        `Unexpected perspective id ${perspectiveId} for perspective ${JSON.stringify(secured)}`
      );
    }

    // action is done on the cache
    await this.cacheInitialized();

    await this.cache.newPerspectives.put({
      id: perspectiveId,
      context: secured.object.payload.context,
      head: details.headId
    });
  }

  async cacheInitialized(): Promise<void> {
    const block = await this.cache.meta.get('block');
    if (block !== undefined && block.value !== undefined) {
      return;
    }

    await this.initCache();
  }

  async getEveesDataOf(userId: string, block?: number): Promise<UserPerspectivesDetails> {
    block = block || (await this.connection.getLatestBlock());
    const head = await this.connection.getHead(userId, EVEES_KEYS, block);
    if (!head) {
      this.logger.log(`Evees Data of ${userId} is undefined`);
      return {};
    }

    const eveesData = (await this.store.get(head)) as UserPerspectivesDetails;
    this.logger.log(`Evees Data of ${userId}`, eveesData);
    return eveesData ? eveesData : {};
  }

  async initCache(): Promise<void> {
    if (!this.userId) throw new Error('user not defined');

    const block = await this.connection.getLatestBlock();
    const eveesData = await this.getEveesDataOf(this.userId, block);
    await this.cache.meta.put({ entry: 'block', value: block });
    await this.cache.meta.put({ entry: 'eveesData', value: eveesData });
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    for (var newPerspectiveData of newPerspectivesData) {
      await this.createPerspective(newPerspectiveData);
    }
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    this.logger.log('getContextPerspectives', { context });
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const contextStore = await this.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
      context
    });
    const perspectiveIds = [...contextStore.values()];

    // include perspectives of the cache
    const cachedPerspectives = await this.cache.newPerspectives
      .where('context')
      .equals(context)
      .toArray();

    const allPerspectivesIds = perspectiveIds.concat(cachedPerspectives.map(e => e.id));

    this.logger.log('getContextPerspectives - done ', {
      context,
      allPerspectivesIds
    });
    return allPerspectivesIds;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const { payload: perspective } = (await this.store.get(perspectiveId)) as Signed<Perspective>;

    /** even if I'm not logged in, show the cached data (valid for the local user) */
    if ((await this.cache.meta.get('block')) !== undefined) {
      /** head update have priority over newPerspective (in case a newPerspective head is updated) */
      const cachedUpdate = await this.cache.updates.get(perspectiveId);
      if (cachedUpdate !== undefined) {
        return { headId: cachedUpdate.head };
      }

      const cachedNewPerspective = await this.cache.newPerspectives.get(perspectiveId);
      if (cachedNewPerspective !== undefined) {
        return { headId: cachedNewPerspective.head };
      }

      const cachedUserPerspectives = (await this.cache.meta.get('eveesData')).value;
      if (cachedUserPerspectives[perspectiveId]) {
        return cachedUserPerspectives[perspectiveId];
      }
    }

    /** if nothing found on the cache, then read it from the blockchain */
    const userPerspectives = await this.getEveesDataOf(perspective.creatorId);
    return userPerspectives[perspectiveId];
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async isLogged() {
    return this.connection.canSign();
  }

  async login(userId?: string): Promise<void> {
    await this.connection.connectWallet(userId);
  }

  async logout(): Promise<void> {
    await this.connection.disconnectWallet();
  }

  async connect() {}

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
