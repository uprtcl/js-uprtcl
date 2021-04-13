import {
  CASStore,
  EveesMutation,
  Logger,
  NewPerspective,
  PartialPerspective,
  Perspective,
  PerspectiveDetails,
  PerspectiveGetResult,
  Proposals,
  RemoteEvees,
  SearchEngine,
  Secured,
  Signed,
  snapDefaultPerspective,
  Update,
} from '@uprtcl/evees';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { EveesAccessControlOrbitDB } from './evees-acl.orbit-db';
import { EveesOrbitDBEntities } from '../custom-stores/orbit-db.stores';

const evees_if = 'evees-v0';
// const timeout = 200;
const defaultDetails: PerspectiveDetails = {
  headId: undefined,
};

const notLogged = () => new Error('must be logged in to use this method');

const ENABLE_LOG = false;

export class EveesOrbitDB implements RemoteEvees {
  logger: Logger = new Logger('EveesOrbitDB');
  accessControl: any;
  proposals!: Proposals;
  store!: CASStore;

  constructor(
    public orbitdbcustom: OrbitDBCustom,
    public searchEngine: SearchEngine,
    public casID: string,
    private postFix?: string
  ) {
    if (orbitdbcustom.getManifest(EveesOrbitDBEntities.Perspective) === undefined) {
      throw new Error(
        'orbitdb custom must include the EveesOrbitDBEntities.Perspective EveesOrbitDBEntities.Context stores'
      );
    }
    this.accessControl = new EveesAccessControlOrbitDB();
  }

  setStore(store) {
    this.store = store;
    this.accessControl.setStore(store);
  }

  get id() {
    return `orbitdb:${evees_if}${this.postFix ? `:${this.postFix}` : ''}`;
  }

  get defaultPath() {
    return '';
  }

  get userId() {
    if (!this.orbitdbcustom) return undefined;
    return this.orbitdbcustom.identity.id;
  }

  canUpdate(uref: string): Promise<boolean> {
    return this.accessControl.canUpdate(uref, this.userId);
  }

  async ready(): Promise<void> {
    await Promise.all([this.orbitdbcustom.ready()]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspective = await this.store.storeEntity({
      object: secured.object,
      casID: this.casID,
    });
    if (ENABLE_LOG) {
      this.logger.log(`[OrbitDB] persistPerspectiveEntity - added to IPFS`, perspective.id);
    }

    if (secured.id && secured.id !== perspective.id) {
      throw new Error(
        `perspective ID computed by IPFS ${perspective.id} is not the same as the input one ${secured.id}.`
      );
    }

    if (ENABLE_LOG) {
      this.logger.log('persisting', secured);
    }

    return perspective.id;
  }

  async getPerspectiveStore(perspectiveId: string, pin = false) {
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const secured = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    if (ENABLE_LOG) {
      this.logger.log('getting', { perspectiveId, secured });
    }

    return this.orbitdbcustom.getStore(EveesOrbitDBEntities.Perspective, secured, pin);
  }

  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    const securedPerspective = await snapDefaultPerspective(this, perspective);
    return securedPerspective;
  }

  async newPerspective(perspectiveData: NewPerspective): Promise<void> {
    if (ENABLE_LOG) {
      this.logger.log('createPerspective', perspectiveData);
    }

    if (!(await this.isLogged())) throw notLogged();
    const secured = perspectiveData.perspective;
    const details = perspectiveData.update.details;

    /** validate */
    if (!secured.object.payload.remote) throw new Error('remote cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    await this.updatePerspectiveInternal(perspectiveId, details, true);
  }

  public async updatePerspective(update: Update) {
    return this.updatePerspectiveInternal(update.perspectiveId, update.details, false);
  }

  private async updatePerspectiveInternal(
    perspectiveId: string,
    details: PerspectiveDetails,
    pin: boolean
  ): Promise<void> {
    if (ENABLE_LOG) {
      this.logger.log('updatePerspective', { perspectiveId, details });
    }
    if (!(await this.isLogged())) throw notLogged();
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const { details: currentDetails } = await this.getPerspective(perspectiveId);

    /** keep existing or update each entry */
    details = Object.keys(details).reduce(
      (a, c) => (details[c] === undefined ? a : { ...a, [c]: details[c] }),
      {}
    );

    const newDetails: PerspectiveDetails = { ...currentDetails, ...details };

    const headChange = currentDetails.headId !== newDetails.headId;

    if (headChange) {
      const perspectiveStore = await this.getPerspectiveStore(perspectiveId, pin);
      await perspectiveStore.add(newDetails);
    }

    if (ENABLE_LOG) {
      this.logger.log('updatePerspective - done', { perspectiveId, details });
    }
  }

  /**
   * @override
   */
  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const perspectiveStore = await this.getPerspectiveStore(perspectiveId);
    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();

    const output = latestEntry ? latestEntry.payload.value : defaultDetails;
    const details = { ...output };
    return { details };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const secured = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    await this.orbitdbcustom.dropStore(EveesOrbitDBEntities.Perspective, secured);
  }

  async flush() {}
  async diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented');
  }

  async update(mutation: EveesMutation) {
    await Promise.all(
      mutation.newPerspectives?.map((newPerspective) => this.newPerspective(newPerspective))
    );
    await Promise.all(mutation.updates?.map((update) => this.updatePerspective(update)));
    await Promise.all(
      mutation.deletedPerspectives?.map((deleted) => this.deletePerspective(deleted))
    );
  }

  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async isLogged(): Promise<boolean> {
    return this.orbitdbcustom.isLogged();
  }

  async login(): Promise<void> {
    return this.orbitdbcustom.login();
  }

  async logout(): Promise<void> {
    return this.orbitdbcustom.logout();
  }

  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {}
}
