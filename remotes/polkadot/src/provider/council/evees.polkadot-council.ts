import { EventEmitter } from 'events';

import {
  ClientRemote,
  Perspective,
  NewPerspective,
  Secured,
  Logger,
  PartialPerspective,
  snapDefaultPerspective,
  EveesMutation,
  PerspectiveGetResult,
  Update,
  ClientEvents,
  ConnectionLoggedEvents,
  EntityStore,
  EveesMutationCreate,
  GetPerspectiveOptions,
  SearchOptions,
  SearchResult,
  ClientExplore,
  EntityRemote,
} from '@uprtcl/evees';
import { EveesAccessControlFixedOwner } from '@uprtcl/evees-blockchain';

import { PolkadotConnection } from '../../connection.polkadot';
import { CouncilStoreEvents, PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalsPolkadotCouncil } from './evees.polkadot-council.proposals';
import { ProposalConfig } from './proposal.config.types';

const evees_if = 'council';

export class EveesPolkadotCouncil implements ClientRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlFixedOwner;
  proposals: ProposalsPolkadotCouncil;
  councilStorage: PolkadotCouncilEveesStorage;
  events!: EventEmitter;

  constructor(
    readonly connection: PolkadotConnection,
    readonly entityStore: EntityStore,
    readonly explorer: ClientExplore,
    readonly config: ProposalConfig,
    readonly casID?: string
  ) {
    this.accessControl = new EveesAccessControlFixedOwner();
    this.councilStorage = new PolkadotCouncilEveesStorage(connection, entityStore, config, casID);
    this.proposals = new ProposalsPolkadotCouncil(
      connection,
      this.councilStorage,
      entityStore,
      this.id,
      config
    );

    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    if (this.councilStorage.events) {
      this.councilStorage.events.on(CouncilStoreEvents.perspectivesUpdated, (perpectiveIds) => {
        this.events.emit(ClientEvents.updated, perpectiveIds);
      });
    }
  }

  get entityRemote(): EntityRemote {
    return this.entityStore.remotes[0];
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
    await Promise.all([this.councilStorage.init()]);
  }

  async canUpdate(uref: string) {
    /** no one can directly update a council governed perspective */
    return false;
  }

  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    /** only the council can create perspectives */
    return snapDefaultPerspective(this, { ...perspective, creatorId: 'council' });
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const details = await this.councilStorage.getPerspective(perspectiveId);
    return { details: { ...details } };
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
  update(mutation: EveesMutationCreate): Promise<void> {
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
  clear(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions | undefined
  ): Promise<SearchResult> {
    return this.explorer.explore(searchOptions, fetchOptions);
  }

  async isLogged() {
    return this.userId !== undefined;
  }

  async login(): Promise<void> {
    await this.connection.connectWallet();
    await this.proposals.init();

    this.events.emit(ConnectionLoggedEvents.logged_in);
    this.events.emit(ConnectionLoggedEvents.logged_status_changed);
  }

  async logout(): Promise<void> {
    await this.connection.disconnectWallet();

    this.events.emit(ConnectionLoggedEvents.logged_out);
    this.events.emit(ConnectionLoggedEvents.logged_status_changed);
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
