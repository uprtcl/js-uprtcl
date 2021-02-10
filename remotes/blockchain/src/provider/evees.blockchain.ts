import { html, TemplateResult } from 'lit-element';

import {
  RemoteEvees,
  Perspective,
  NewPerspective,
  Secured,
  Proposals,
  Logger,
  CASStore,
  SearchEngine,
  Update,
  PartialPerspective,
  snapDefaultPerspective,
  PerspectiveGetResult,
  Signed,
  EveesMutationCreate,
  CASRemote,
  EveesMutation,
} from '@uprtcl/evees';

import { EveesAccessControlFixedOwner } from './evees-acl.fixed';
import { BlockchainConnection } from './evees.blockchain.connection';
import { UserPerspectivesDetails } from '../types';

const evees_if = 'fixed-owner';

/** An abstraction of a service that stores evees heads on a blockchain under a
 * single evolving object of type UserPerspectivesDetails that contains all the
 * perspectiveIds and their heads */
export class EveesBlockchain implements RemoteEvees {
  logger: Logger = new Logger('EveesBlockchain');

  accessControl: EveesAccessControlFixedOwner;
  store!: CASStore;

  constructor(
    public connection: BlockchainConnection,
    public searchEngine: SearchEngine,
    public storeRemote: CASRemote,
    public proposals: Proposals
  ) {
    this.accessControl = new EveesAccessControlFixedOwner();
  }

  setStore(store: CASStore) {
    this.store = store;
    this.accessControl.setStore(store);
  }

  newPerspective(newPerspective: NewPerspective): Promise<void> {
    return this.update({ newPerspectives: [newPerspective] });
  }
  deletePerspective(perspectiveId: string): Promise<void> {
    return this.update({ deletedPerspectives: [perspectiveId] });
  }
  async diff(): Promise<EveesMutation> {
    return { newPerspectives: [], deletedPerspectives: [], updates: [] };
  }
  flush(): Promise<void> {
    /** dont have cache */
    return Promise.resolve();
  }
  refresh(): Promise<void> {
    return Promise.resolve();
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  ready(): Promise<void> {
    return this.connection.ready();
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

  async canUpdate(uref: string) {
    return this.userId ? this.accessControl.canUpdate(uref, this.userId) : false;
  }

  async updatePerspective(update: Update) {
    this.update({ updates: [update] });
  }

  /** set the parent owner as creatorId (and thus owner) */
  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
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
    const eveesData = await this.store.getEntity<UserPerspectivesDetails>(head);
    return eveesData ? eveesData.object : {};
  }

  async getEveesDataOf(userId: string, block?: number): Promise<UserPerspectivesDetails> {
    const head = await this.getEveesHeadOf(userId, block);
    return this.getEveesDataFromHead(head);
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    /** if nothing found on the cache, then read it from the blockchain */
    const userPerspectives = await this.getEveesDataOf(perspective.object.payload.creatorId);
    const details = userPerspectives[perspective.id];
    return { details };
  }

  async updateEveesData(mutation: EveesMutationCreate) {
    if (!this.userId) throw new Error('user not logged in');

    const eveesData = await this.getEveesDataOf(this.userId);

    if (mutation.newPerspectives) {
      await Promise.all(
        mutation.newPerspectives.map(async (newPerspective) => {
          await this.persistPerspectiveEntity(newPerspective.perspective);
          eveesData[newPerspective.perspective.id] = newPerspective.update.details;
        })
      );
    }

    if (mutation.updates) {
      mutation.updates.map((update) => {
        const current = eveesData[update.perspectiveId];
        eveesData[update.perspectiveId] = { ...current, ...update.details };
      });
    }

    if (mutation.deletedPerspectives) {
      mutation.deletedPerspectives.map((toDelete) => {
        delete eveesData[toDelete];
      });
    }

    const hash = await this.store.storeEntity({ object: eveesData, remote: this.id });

    this.logger.log('new evees data object created', {
      hash,
      eveesData,
      mutation,
    });

    return hash;
  }

  async update(mutation: EveesMutationCreate) {
    const newHash = await this.updateEveesData(mutation);
    await this.connection.updateHead(newHash);
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

  icon(): TemplateResult {
    return this.connection.icon ? this.connection.icon() : html``;
  }

  avatar(userId: string, config: any) {
    return this.connection.avatar ? this.connection.avatar(userId, config) : html``;
  }
}
