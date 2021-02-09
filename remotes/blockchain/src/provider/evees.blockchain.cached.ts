import { html, TemplateResult } from 'lit-element';

import { EveesOrbitDBEntities } from '@uprtcl/evees-orbitdb';

import {
  RemoteEvees,
  Perspective,
  PerspectiveDetails,
  NewPerspective,
  Secured,
  Proposals,
  hashObject,
  deriveSecured,
  Logger,
  CASStore,
  SearchEngine,
  Update,
  PartialPerspective,
  snapDefaultPerspective,
  PerspectiveGetResult,
  Signed,
} from '@uprtcl/evees';

import { EveesCacheDB } from './evees.cache.db';
import { EveesAccessControlFixed } from './evees-acl.fixed';
import { BlockchainConnection } from './evees.blockchain.connection';
import { UserPerspectivesDetails, RemoteStatus } from '../types';

const evees_if = 'fixed';

export class EveesBlockchainCached implements RemoteEvees {
  logger: Logger = new Logger('EveesBlockchain');
  accessControl: EveesAccessControlFixed;

  constructor(
    public connection: BlockchainConnection,
    public searchEngine: SearchEngine,
    public store: CASStore,
    public proposals: Proposals
  ) {
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

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.store.storeEntity({
      object: secured.object,
      remote: secured.object.payload.remote,
    });
    this.logger.log('[ETH] persistPerspectiveEntity - added to IPFS', perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    return perspectiveId;
  }

  async canUpdate(uref: string) {
    return this.userId ? this.accessControl.canUpdate(uref, this.userId) : false;
  }

  async updatePerspective(update: Update) {
    this.updatePerspectives([update]);
  }

  /** set the parent owner as creatorId (and thus owner) */
  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
  }

  async createPerspective(perspectiveData: NewPerspective): Promise<void> {
    this.createPerspectives([perspectiveData]);
  }

  async getEveesHeadOf(userId: string, block?: number): Promise<string | undefined> {
    block = block || (await this.connection.getLatestBlock());
    const head = await this.connection.getHead(userId, block);
    if (!head) {
      this.logger.log(`Evees Data of ${userId} is undefined`);
      return undefined;
    }
    return head;
  }

  async getEveesDataFromHead(head: string | undefined): Promise<UserPerspectivesDetails> {
    if (!head) return {};
    const eveesData = (await this.store.get(head)) as UserPerspectivesDetails;
    return eveesData ? eveesData : {};
  }

  async getEveesDataOf(userId: string, block?: number): Promise<UserPerspectivesDetails> {
    const head = await this.getEveesHeadOf(userId, block);
    return this.getEveesDataFromHead(head);
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    /** if nothing found on the cache, then read it from the blockchain */
    const userPerspectives = await this.getEveesDataOf(perspective.object.payload.creatorId);
    return userPerspectives[perspective.id];
  }

  async createNewEveesData() {
    if (!this.cache) throw new Error('cache not initialized, probably the user was not logged in');
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
    if (!this.cache) throw new Error('cache not initialized, probably the user was not logged in');
    const newHash = await this.createNewEveesData();

    /** create the context stores for the new perspectives */
    const newPerspectives = await this.cache.newPerspectives.toArray();
    const deletedPerspectivesIds = await this.cache.deletePerspectives.toArray();

    this.logger.info('updating context stores');
    await Promise.all(
      newPerspectives.map(async (newPerspective) => {
        /** create and pin context stores */
        const contextStore = await this.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
          context: newPerspective.context,
        });

        this.logger.info(`contextStore.add(${newPerspective.id})`);
        const contextP = contextStore.add(newPerspective.id);

        /** force pin of proposals to each perspective stores */
        const proposalP = this.proposals.getProposalsToPerspective(newPerspective.id);

        return Promise.all([proposalP, contextP]);
      })
    );
    await Promise.all(
      deletedPerspectivesIds.map(async (deletedPerspective) => {
        /** create and pin context stores */
        const perspective = (await this.store.get(deletedPerspective.id)) as Signed<Perspective>;
        const contextStore = await this.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
          context: perspective.payload.context,
        });

        this.logger.info(`contextStore.delete(${deletedPerspective.id})`);
        const contextP = contextStore.delete(deletedPerspective.id);

        return contextP;
      })
    );

    this.logger.info('updating context stores - done');

    return this.updateHead(newHash);
  }

  async updateHead(newHash: string | undefined) {
    if (!this.cache) throw new Error('cache not initialized, probably the user was not logged in');
    await this.connection.updateHead(newHash);

    /* delete cache */
    await this.cache.meta.clear();
    await this.cache.newPerspectives.clear();
    await this.cache.updates.clear();
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    if (!this.cache) throw new Error('cache not initialized, probably the user was not logged in');
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
    const perspective = (await this.store.get(perspectiveId)) as Signed<Perspective>;
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
      throw new Error('userId/account should ne be undefined after wallet was connected');
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
    return this.connection.avatar ? this.connection.avatar(userId, config) : html``;
  }

  lense(): Lens {
    return {
      name: 'evees-orbitb:remote',
      type: 'remote',
      render: (entity: any) => {
        return html`
          <evees-blockchain-remote remote-id=${entity.remoteId}></evees-blockchain-remote>
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
