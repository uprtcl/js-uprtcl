import { html } from 'lit-element';

import { CASStore, loadEntity } from '@uprtcl/multiplatform';
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
  EveesHelpers,
  hashObject,
  deriveSecured
} from '@uprtcl/evees';

import { Lens } from '@uprtcl/lenses';

import { EveesCacheDB } from './evees.cache.db';
import { EveesAccessControlFixed } from './evees-acl.fixed';
import { BlockchainConnection } from './evees.blockchain.connection';

const evees_if = 'fixed';

export interface UserPerspectivesDetails {
  [perspectiveId: string]: {
    headId?: string;
  };
}

export interface RemoteStatus {
  pendingActions: number;
}

export class EveesBlockchainCached implements EveesRemote {
  logger: Logger = new Logger('EveesBlockchain');

  accessControl: EveesAccessControlFixed;
  cache: EveesCacheDB;

  constructor(
    public connection: BlockchainConnection,
    protected orbitdbcustom: OrbitDBCustom,
    public store: CASStore,
    public proposals: ProposalsProvider,
    cacheName: string
  ) {
    if (orbitdbcustom.getManifest(EveesOrbitDBEntities.Context) === undefined) {
      throw new Error(
        'orbitdb custom must include the PolkadotEveesOrbitDBEntities.Context stores'
      );
    }
    this.accessControl = new EveesAccessControlFixed(store);
    this.cache = new EveesCacheDB(cacheName);
  }

  get id() {
    return `${this.connection.getNetworkId()}:${evees_if}`;
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

  // updatePerspectiveDetails?
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails,
    pin: boolean = false
  ) {
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
   
    let creatorId = '';
    timestamp = timestamp ? timestamp : Date.now();
    
    if (parentId !== undefined) {
      const parent = await this.store.get(parentId) as Signed<Perspective>;
      creatorId = parent.payload.creatorId;
    } else {
      creatorId = this.userId as string
    }

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
    const head = await this.connection.getHead(userId, block);
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

  async flushCache() {
    if (!this.userId) throw new Error('user not logged in');

    const newPerspectives = await this.cache.newPerspectives.toArray();
    const updates = await this.cache.updates.toArray();

    const eveesData = await this.getEveesDataOf(this.userId);

    newPerspectives.map(newPerspective => {
      eveesData[newPerspective.id] = { headId: newPerspective.head };
    });

    updates.map(update => {
      eveesData[update.id] = { headId: update.head };
    });

    const newEveesDetailsHash = await this.store.create(eveesData);

    this.logger.log('flushing cache and updateing evees data ', {
      eveesData,
      newPerspectives,
      updates
    });

    await this.connection.updateHead(newEveesDetailsHash);

    /* delete cache */
    await this.cache.meta.clear();
    await this.cache.newPerspectives.clear();
    await this.cache.updates.clear();
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

  lense(): Lens {
    return {
      name: 'evees-orbitb:remote',
      type: 'remote',
      render: (entity: any) => {
        return html`
          <evees-blockchain-remote remote-id=${entity.remoteId}></evees-blockchain-remote>
        `;
      }
    };
  }

  async getPendingActions(): Promise<number> {
    const hasCache = (await this.cache.meta.get('block')) !== undefined;
    if (!hasCache) return 0;

    const nNew = await this.cache.newPerspectives.count();
    const nUpdates = await this.cache.updates.count();

    return nNew + nUpdates;
  }

  async getStatus(): Promise<RemoteStatus> {
    return {
      pendingActions: await this.getPendingActions()
    };
  }
}
