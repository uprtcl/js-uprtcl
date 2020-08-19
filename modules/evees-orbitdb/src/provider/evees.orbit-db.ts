// import pEvent from 'p-event';
import { Container } from 'inversify';
import { ApolloClient } from 'apollo-boost';

import { Logger } from '@uprtcl/micro-orchestrator';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { OwnerAccessControlService } from '@uprtcl/access-control';
import { Signed, Entity } from '@uprtcl/cortex';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ConnectionOptions, loadEntity } from '@uprtcl/multiplatform';

import {
  Secured,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  EveesRemote,
  ProposalsProvider,
} from '@uprtcl/evees';

import { EveesAccessControlOrbitDB } from './evees-access-control.orbit-db';
import {
  OrbitDBConnection,
  OrbitDBConnectionOptions,
} from './orbit-db.connection';

const evees_if = 'evees-v0';
// const timeout = 200;
const defaultDetails: PerspectiveDetails = {
  name: '',
  context: undefined,
  headId: undefined,
};

const notLogged = () => new Error('must be logged in to use this method');

const msg = (website) => `
--UPRTCL SITE: ${website}--

PLEASE READ

DO NOT SIGN THIS SAME MESSAGE ON OTHER SITES
BECAUSE YOUR PASSWORD WILL BE STOLEN
`;

export class EveesOrbitDB implements EveesRemote {
  logger: Logger = new Logger('EveesOrbitDB');
  accessControl!: OwnerAccessControlService;
  proposals!: ProposalsProvider;
  loggedIn: boolean = false;

  constructor(
    protected ethConnection: EthereumConnection,
    protected orbitdbConnection: OrbitDBConnection,
    public store: IpfsStore,
    protected container: Container,
    protected orbitdbOptions?: OrbitDBConnectionOptions,
    protected connectionOptions?: ConnectionOptions
  ) {
    this.accessControl = new EveesAccessControlOrbitDB(container, this.store);
  }

  get id() {
    return `orbitdb:${evees_if}`;
  }

  get defaultPath() {
    return '';
  }

  get userId() {
    if (!this.orbitdbConnection) return undefined;
    return this.orbitdbConnection.identity.id;
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([
      this.ethConnection.ready(),
      this.orbitdbConnection.ready(),
      this.store.ready(),
    ]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.store.create(secured.object);
    this.logger.log(
      `[OrbitDB] persistPerspectiveEntity - added to IPFS`,
      perspectiveId
    );

    if (secured.id && secured.id !== perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    this.logger.log('persisting', secured);

    return perspectiveId;
  }

  async getPerspectiveStore(perspectiveId: string) {
    if (!this.orbitdbConnection)
      throw new Error('orbit db connection undefined');

    const client: ApolloClient<any> = this.container.get(
      ApolloClientModule.bindings.Client
    );

    const signedPerspective = (await loadEntity(
      client,
      perspectiveId
    )) as Entity<Signed<Perspective>>;

    this.logger.log('getting', { perspectiveId, signedPerspective });

    return this.orbitdbConnection.perspectiveStore(
      signedPerspective.object.payload
    );
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    // const canWrite = perspectiveData.canWrite;

    /** validate */
    if (!secured.object.payload.remote)
      throw new Error('remote cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    await this.updatePerspective(perspectiveId, details);
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    await Promise.all(
      newPerspectivesData.map(this.createPerspective.bind(this))
    );
  }

  /**
   * @override
   */
  async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    if (!this.orbitdbConnection)
      throw new Error('orbit db connection undefined');
    if (details.name) throw new Error('details.name is not supported');

    const currentDetails: PerspectiveDetails = await this.getPerspective(
      perspectiveId
    );

    details = Object.keys(details).reduce(
      (a, c) => (details[c] === undefined ? a : { ...a, [c]: details[c] }),
      {}
    );

    const newDetails: PerspectiveDetails = { ...currentDetails, ...details };
    const perspectiveStore = await this.getPerspectiveStore(perspectiveId);
    await perspectiveStore.add(newDetails);

    const contextChange = currentDetails.context !== newDetails.context;

    if (contextChange && currentDetails.context) {
      const contextStore = await this.orbitdbConnection.contextStore(
        currentDetails.context
      );
      await contextStore.delete(perspectiveId);
    }
    if (contextChange && newDetails.context) {
      const contextStore = await this.orbitdbConnection.contextStore(
        newDetails.context
      );
      await contextStore.add(perspectiveId);
    }
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    if (!this.orbitdbConnection)
      throw new Error('orbit db connection undefined');

    const contextStore = await this.orbitdbConnection.contextStore(context);
    const perspectiveIds = [...contextStore.values()];

    this.logger.log(
      `[OrbitDB] getContextPerspectives of ${context}`,
      perspectiveIds
    );

    return perspectiveIds;
  }

  /**
   * @override
   */
  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const perspectiveStore = await this.getPerspectiveStore(perspectiveId);
    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();

    const output = latestEntry ? latestEntry.payload.value : defaultDetails;
    return { ...output };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    if (!this.orbitdbConnection)
      throw new Error('orbit db connection undefined');

    const perspectiveStore = await this.getPerspectiveStore(perspectiveId);
    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();

    const context = latestEntry && latestEntry.payload.value.context;
    if (context) {
      const contextStore = await this.orbitdbConnection.contextStore(context);
      await contextStore.delete(perspectiveId);
    }

    await perspectiveStore.drop();
  }

  async isLogged(): Promise<boolean> {
    return this.loggedIn;
  }

  async login(): Promise<void> {
    if (this.loggedIn) {
      return;
    }
    const signature = await this.ethConnection.signText(
      msg(window.location.origin),
      this.ethConnection.getCurrentAccount()
    );
    const identity = await this.orbitdbConnection.deriveIdentity(signature);
    this.orbitdbConnection.useIdentity(identity);
    this.loggedIn = true;
  }

  async logout(): Promise<void> {
    if (!this.loggedIn) {
      return;
    }
    this.orbitdbConnection.useIdentity(
      this.orbitdbConnection.instance.identity
    );
    this.loggedIn = false;
  }

  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {}
}
