import { EventEmitter } from 'events';

import {
  RemoteEvees,
  Perspective,
  NewPerspective,
  Secured,
  Logger,
  CASStore,
  PartialPerspective,
  snapDefaultPerspective,
  EveesMutation,
  EveesMutationCreate,
  PerspectiveGetResult,
  SearchEngine,
  Update,
  RemoteLoggedEvents,
} from '@uprtcl/evees';
import { EveesAccessControlFixedOwner } from '@uprtcl/evees-blockchain';

import { PolkadotConnection } from '../../connection.polkadot';
import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalsPolkadotCouncil } from './evees.polkadot-council.proposals';
import { ProposalConfig } from './proposal.config.types';

const evees_if = 'council';

export class EveesPolkadotCouncil implements RemoteEvees {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlFixedOwner;
  store!: CASStore;
  proposals: ProposalsPolkadotCouncil;
  councilStorage: PolkadotCouncilEveesStorage;
  searchEngine!: SearchEngine;
  events!: EventEmitter;

  constructor(
    readonly connection: PolkadotConnection,
    readonly casID: string,
    readonly config: ProposalConfig
  ) {
    this.accessControl = new EveesAccessControlFixedOwner();
    this.councilStorage = new PolkadotCouncilEveesStorage(connection, config, this.casID);
    this.proposals = new ProposalsPolkadotCouncil(connection, this.councilStorage, this.id, config);
    this.events = new EventEmitter();
  }

  setStore(store: CASStore) {
    this.store = store;
    this.accessControl.setStore(store);
    this.councilStorage.setStore(store);
    this.proposals.setStore(store);
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
    await Promise.all([this.councilStorage.ready()]);
  }

  async canUpdate(uref: string) {
    /** no one can directly update a council governed perspective */
    return false;
  }

  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    /** only the council can create perspectives */
    const creatorId = 'council';
    return snapDefaultPerspective(this, { creatorId: 'council' });
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const details = await this.councilStorage.getPerspective(perspectiveId);
    return { details };
  }
  update(mutation: EveesMutationCreate) {
    throw new Error('Method not implemented.');
  }
  newPerspective(newPerspective: NewPerspective): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deletePerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updatePerspective(update: Update): Promise<void> {
    throw new Error('Method not implemented.');
  }
  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async isLogged() {
    return this.userId !== undefined;
  }

  async login(): Promise<void> {
    await this.connection.connectWallet();
    await this.proposals.init();

    this.events.emit(RemoteLoggedEvents.logged_out);
    this.events.emit(RemoteLoggedEvents.logged_status_changed);
  }

  logout(): Promise<void> {
    this.events.emit(RemoteLoggedEvents.logged_in);
    this.events.emit(RemoteLoggedEvents.logged_status_changed);
    return this.connection.disconnectWallet();
  }

  async connect() {
    return this.connection.connect();
  }

  async isConnected() {
    return true;
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
