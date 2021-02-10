import { html } from 'lit-element';

import {
  RemoteEvees,
  Perspective,
  PerspectiveDetails,
  NewPerspective,
  Secured,
  deriveSecured,
  hashObject,
  Logger,
  CASRemote,
  CASStore,
  PartialPerspective,
  snapDefaultPerspective,
  EveesMutation,
  EveesMutationCreate,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  SearchEngine,
  Update,
} from '@uprtcl/evees';
import { EveesAccessControlFixedOwner } from '@uprtcl/evees-blockchain';

import { PolkadotConnection } from '../../connection.polkadot';
import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalsPolkadotCouncil } from './evees.polkadot-council.proposals';
import { icons } from '../icons';
import { ProposalConfig } from './proposal.config.types';

const evees_if = 'council';

export class EveesPolkadotCouncil implements RemoteEvees {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlFixedOwner;
  proposals: ProposalsPolkadotCouncil;
  store!: CASStore;
  councilStorage: PolkadotCouncilEveesStorage;
  searchEngine!: SearchEngine;

  constructor(
    readonly connection: PolkadotConnection,
    readonly casId: string,
    readonly config: ProposalConfig
  ) {
    this.accessControl = new EveesAccessControlFixedOwner();
    this.councilStorage = new PolkadotCouncilEveesStorage(connection, config, this.casId);
    this.proposals = new ProposalsPolkadotCouncil(connection, this.councilStorage, config);
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
    return this.connection.connectWallet();
  }

  logout(): Promise<void> {
    throw new Error('Method not implemented.');
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
