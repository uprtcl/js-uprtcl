import { html } from 'lit-element';

import { CASStore } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import {
  EveesRemote,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  Secured,
  deriveSecured,
  hashObject,
  EveesHelpers,
} from '@uprtcl/evees';
import { EveesAccessControlFixed } from '@uprtcl/evees-blockchain';

import { PolkadotConnection } from '../../connection.polkadot';
import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalsPolkadotCouncil } from './evees.polkadot-council.proposals';
import { icons } from '../icons';
import { ProposalConfig } from './proposal.config.types';

const evees_if = 'council';

export class EveesPolkadotCouncil implements EveesRemote {
  logger: Logger = new Logger('EveesPolkadot');

  accessControl: EveesAccessControlFixed;
  proposals: ProposalsPolkadotCouncil;

  councilStorage: PolkadotCouncilEveesStorage;

  constructor(
    public connection: PolkadotConnection,
    public store: CASStore,
    public config: ProposalConfig
  ) {
    this.accessControl = new EveesAccessControlFixed(store);
    this.councilStorage = new PolkadotCouncilEveesStorage(
      connection,
      store,
      config
    );
    this.proposals = new ProposalsPolkadotCouncil(
      connection,
      this.councilStorage,
      store,
      config
    );
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

  async getHome(userId?: string) {
    /** this remote can only store perspectives of the council */
    return EveesHelpers.getHome(
      this,
      `${this.connection.getNetworkId()}-council`
    );
  }

  icon() {
    let name = '';
    let iconName = '';
    switch (this.connection.getNetworkId()) {
      case 'Development':
        name = 'dev';
        iconName = 'kusama';
        break;

      case 'Kusama':
        name = 'Kusama';
        iconName = 'kusama';
    }
    return html`
      <div
        style="display:flex;align-items: center;color: #636668;font-weight:bold"
      >
        <div
          style="height: 32px;width: 32px;margin-right: 6px;border-radius:16px;overflow:hidden;"
        >
          ${icons[iconName]}
        </div>
        ${name} Council
      </div>
    `;
  }

  avatar(userId: string, config: any = { showName: true }) {
    if (!config.showName) {
      return html``;
    }

    return html` <div
      style="display:flex;align-items: center;color: #636668;font-weight:bold"
    >
      Council
    </div>`;
  }

  async ready(): Promise<void> {
    await Promise.all([this.store.ready(), this.councilStorage.ready()]);
  }

  async canWrite(uref: string) {
    /** no one can directly update a council governed perspective */
    return false;
  }

  async updatePerspective(perspectiveId: string, details: PerspectiveDetails) {
    throw new Error(
      'cant create perspective directly. Need to create a proposal.'
    );
  }

  async snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string,
    fromPerspectiveId?: string,
    fromHeadId?: string
  ): Promise<Secured<Perspective>> {
    /** only the council can create perspectives */
    const creatorId = 'council';
    timestamp = timestamp ? timestamp : Date.now();

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
    throw new Error(
      'cant create perspective directly. Need to create a proposal.'
    );
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    throw new Error(
      'cant create perspective directly. Need to create a proposal.'
    );
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    const perspectives = await this.councilStorage.getContextPerspectives(
      context
    );
    if (context === `${this.connection.getNetworkId()}-council.home`) {
      const home = await this.getHome();
      perspectives.push(home.id);
    }
    return perspectives;
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.councilStorage.getPerspective(perspectiveId);
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
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
