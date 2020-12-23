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
  hashObject,
  deriveSecured,
  EveesHelpers,
} from '@uprtcl/evees';

import { Lens } from '@uprtcl/lenses';

import { EveesCacheDB } from './evees.cache.db';
import { EveesAccessControlFixed } from './evees-acl.fixed';
import { BlockchainConnection } from './evees.blockchain.connection';
import { TemplateResult } from 'lit-html';
import { UserPerspectivesDetails, RemoteStatus } from '../types';

const evees_if = 'fixed';

export class EveesBlockchainCached implements EveesRemote {
  logger: Logger = new Logger('EveesBlockchain');

  accessControl: EveesAccessControlFixed;
  cache: EveesCacheDB | undefined;

  constructor(
    public connection: BlockchainConnection,
    public orbitdbcustom: OrbitDBCustom,
    public store: CASStore,
    public proposals: ProposalsProvider
  ) {
    if (orbitdbcustom.getManifest(EveesOrbitDBEntities.Context) === undefined) {
      throw new Error(
        'orbitdb custom must include the PolkadotEveesOrbitDBEntities.Context stores'
      );
    }
    this.accessControl = new EveesAccessControlFixed(store);
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
    return this.userId ? this.accessControl.canWrite(uref, this.userId) : false;
  }

  // updatePerspectiveDetails?
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails,
    pin: boolean = false
  ) {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );

    // action is done on the cache
    await this.cacheInitialized();

    this.cache.updates.put({
      id: perspectiveId,
      head: details.headId as string,
    });
  }

  async getHome(userId?: string) {
    return EveesHelpers.getHome(this, userId);
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
    let creatorId = '';
    timestamp = timestamp ? timestamp : Date.now();

    if (parentId !== undefined) {
      const parent = (await this.store.get(parentId)) as Signed<Perspective>;
      creatorId = parent.payload.creatorId;
    } else {
      creatorId = this.userId as string;
    }

    const defaultContext = await hashObject({
      creatorId,
      timestamp,
    });

    context = context || defaultContext;

    const object: Perspective = {
      creatorId,
      remote: this.id,
      path: path !== undefined ? path : this.defaultPath,
      timestamp,
      context,
    };

    if (fromPerspectiveId) object.fromPerspectiveId = fromPerspectiveId;
    if (fromHeadId) object.fromHeadId = fromHeadId;

    const perspective = await deriveSecured<Perspective>(
      object,
      this.store.cidConfig
    );
    perspective.casID = this.store.casID;

    return perspective;
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );

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
        `Unexpected perspective id ${perspectiveId} for perspective ${JSON.stringify(
          secured
        )}`
      );
    }

    // action is done on the cache
    await this.cacheInitialized();

    await this.cache.newPerspectives.put({
      id: perspectiveId,
      context: secured.object.payload.context,
      head: details.headId,
    });

    /** start pinning the context store already */
    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context: secured.object.payload.context,
      },
      true
    );
    await contextStore.add(perspectiveId);
  }

  async cacheInitialized(): Promise<void> {
    if (!this.cache) return;

    const block = await this.cache.meta.get('block');
    if (block !== undefined && block.value !== undefined) {
      return;
    }

    await this.initCache();
  }

  async getEveesHeadOf(
    userId: string,
    block?: number
  ): Promise<string | undefined> {
    block = block || (await this.connection.getLatestBlock());
    const head = await this.connection.getHead(userId, block);
    if (!head) {
      this.logger.log(`Evees Data of ${userId} is undefined`);
      return undefined;
    }
    return head;
  }

  async getEveesDataFromHead(
    head: string | undefined
  ): Promise<UserPerspectivesDetails> {
    if (!head) return {};
    const eveesData = (await this.store.get(head)) as UserPerspectivesDetails;
    return eveesData ? eveesData : {};
  }

  async getEveesDataOf(
    userId: string,
    block?: number
  ): Promise<UserPerspectivesDetails> {
    const head = await this.getEveesHeadOf(userId, block);
    return this.getEveesDataFromHead(head);
  }

  async initCache(): Promise<void> {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );
    if (!this.userId) throw new Error('user not defined');

    const block = await this.connection.getLatestBlock();
    const eveesData = await this.getEveesDataOf(this.userId, block);
    await this.cache.meta.put({ entry: 'block', value: block });
    await this.cache.meta.put({ entry: 'eveesData', value: eveesData });
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    for (var newPerspectiveData of newPerspectivesData) {
      await this.createPerspective(newPerspectiveData);
    }
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    this.logger.log('getContextPerspectives', { context });
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context,
      }
    );
    const perspectiveIds = [...contextStore.values()];

    // include perspectives of the cache
    const cachedPerspectives = this.cache
      ? await this.cache.newPerspectives
          .where('context')
          .equals(context)
          .toArray()
      : [];

    const allPerspectivesIds = perspectiveIds.concat(
      cachedPerspectives.map((e) => e.id)
    );

    this.logger.log('getContextPerspectives - done ', {
      context,
      allPerspectivesIds,
    });
    return allPerspectivesIds;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const { payload: perspective } = (await this.store.get(
      perspectiveId
    )) as Signed<Perspective>;

    /** even if I'm not logged in, show the cached data (valid for the local user) */
    if (this.cache && (await this.cache.meta.get('block')) !== undefined) {
      /** head update have priority over newPerspective (in case a newPerspective head is updated) */
      const cachedUpdate = await this.cache.updates.get(perspectiveId);
      if (cachedUpdate !== undefined) {
        return { headId: cachedUpdate.head };
      }

      const cachedNewPerspective = await this.cache.newPerspectives.get(
        perspectiveId
      );
      if (cachedNewPerspective !== undefined) {
        return { headId: cachedNewPerspective.head };
      }

      const cachedUserPerspectives = (await this.cache.meta.get('eveesData'))
        .value;
      if (cachedUserPerspectives[perspectiveId]) {
        return cachedUserPerspectives[perspectiveId];
      }

      const cacheDelete = await this.cache.deletePerspectives.get(
        perspectiveId
      );
      if (cacheDelete !== undefined) {
        return { headId: undefined };
      }
    }

    /** if nothing found on the cache, then read it from the blockchain */
    const userPerspectives = await this.getEveesDataOf(perspective.creatorId);
    return userPerspectives[perspectiveId];
  }

  async createNewEveesData() {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );
    if (!this.userId) throw new Error('user not logged in');

    const newPerspectives = await this.cache.newPerspectives.toArray();
    const updates = await this.cache.updates.toArray();
    const deletes = await this.cache.deletePerspectives.toArray();

    const eveesData = await this.getEveesDataOf(this.userId);

    newPerspectives.map((newPerspective) => {
      eveesData[newPerspective.id] = { headId: newPerspective.head };
    });

    updates.map((update) => {
      eveesData[update.id] = { headId: update.head };
    });

    deletes.map((toDelete) => {
      delete eveesData[toDelete.id];
    });

    const hash = await this.store.create(eveesData);
    this.logger.log('new evees data object created', {
      hash,
      eveesData,
      newPerspectives,
      updates,
    });
    return hash;
  }

  async flushCache() {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );
    const newHash = await this.createNewEveesData();

    /** create the context stores for the new perspectives */
    const newPerspectives = await this.cache.newPerspectives.toArray();
    const deletedPerspectivesIds = await this.cache.deletePerspectives.toArray();

    this.logger.info('updating context stores');
    await Promise.all(
      newPerspectives.map(async (newPerspective) => {
        /** create and pin context stores */
        const contextStore = await this.orbitdbcustom.getStore(
          EveesOrbitDBEntities.Context,
          {
            context: newPerspective.context,
          }
        );

        this.logger.info(`contextStore.add(${newPerspective.id})`);
        const contextP = contextStore.add(newPerspective.id);

        /** force pin of proposals to each perspective stores */
        const proposalP = this.proposals.getProposalsToPerspective(
          newPerspective.id
        );

        return Promise.all([proposalP, contextP]);
      })
    );
    await Promise.all(
      deletedPerspectivesIds.map(async (deletedPerspective) => {
        /** create and pin context stores */
        const perspective = (await this.store.get(
          deletedPerspective.id
        )) as Signed<Perspective>;
        const contextStore = await this.orbitdbcustom.getStore(
          EveesOrbitDBEntities.Context,
          {
            context: perspective.payload.context,
          }
        );

        this.logger.info(`contextStore.delete(${deletedPerspective.id})`);
        const contextP = contextStore.delete(deletedPerspective.id);

        return contextP;
      })
    );

    this.logger.info('updating context stores - done');

    return this.updateHead(newHash);
  }

  async updateHead(newHash: string | undefined) {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );
    await this.connection.updateHead(newHash);

    /* delete cache */
    await this.cache.meta.clear();
    await this.cache.newPerspectives.clear();
    await this.cache.updates.clear();
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    if (!this.cache)
      throw new Error(
        'cache not initialized, probably the user was not logged in'
      );
    if (!this.userId) throw new Error('user logged in');

    // action is done on the cache
    await this.cacheInitialized();

    await this.cache.deletePerspectives.put({
      id: perspectiveId,
    });

    // delete from cache in case it was there
    try {
      await this.cache.newPerspectives.delete(perspectiveId);
      await this.cache.updates.delete(perspectiveId);
    } catch (e) {
      // nop
    }

    /* remove from context store */
    const perspective = (await this.store.get(perspectiveId)) as Signed<
      Perspective
    >;
    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context: perspective.payload.context,
      },
      true
    );
    await contextStore.delete(perspectiveId);
  }

  async isLogged() {
    return this.connection.canSign();
  }

  async login(userId?: string): Promise<void> {
    await this.connection.connectWallet(userId);

    if (!this.connection.account)
      throw new Error(
        'userId/account should ne be undefined after wallet was connected'
      );
    this.cache = new EveesCacheDB(
      `${this.connection.getNetworkId()}-${this.connection.account}-evees-cache`
    );
  }

  async logout(): Promise<void> {
    await this.connection.disconnectWallet();
    this.cache = undefined;
  }

  async connect() {}

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  icon(): TemplateResult {
    return this.connection.icon ? this.connection.icon() : html``;
  }

  avatar(userId: string, config: any) {
    return this.connection.avatar
      ? this.connection.avatar(userId, config)
      : html``;
  }

  lense(): Lens {
    return {
      name: 'evees-orbitb:remote',
      type: 'remote',
      render: (entity: any) => {
        return html`
          <evees-blockchain-remote
            remote-id=${entity.remoteId}
          ></evees-blockchain-remote>
        `;
      },
    };
  }

  async getPendingActions(): Promise<number> {
    if (!this.cache) return 0;

    const hasCache = (await this.cache.meta.get('block')) !== undefined;
    if (!hasCache) return 0;

    const nNew = await this.cache.newPerspectives.count();
    const nUpdates = await this.cache.updates.count();

    return nNew + nUpdates;
  }

  async getStatus(): Promise<RemoteStatus> {
    return {
      pendingActions: await this.getPendingActions(),
    };
  }
}
