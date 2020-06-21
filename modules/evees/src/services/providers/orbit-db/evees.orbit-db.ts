// import pEvent from 'p-event';

import { Logger } from '@uprtcl/micro-orchestrator';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { Remote, OwnerAccessControlService } from '@uprtcl/access-control';
import { Signed } from '@uprtcl/cortex';

import { Secured } from '../../../utils/cid-hash';
import {
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
} from '../../../types';
import { EveesRemote } from '../../evees.remote';
import { EveesAccessControlOrbitDB } from './evees-access-control.orbit-db';
import { OrbitDBConnection } from './orbit-db.connection';
import { ProposalsProvider } from '../../../services/proposals.provider';

const evees_if = 'evees-v0';
const timeout = 200;
const defaultDetails: PerspectiveDetails = {
  name: '',
  context: undefined,
  headId: undefined,
};

export class EveesOrbitDB implements EveesRemote {
  logger: Logger = new Logger('EveesOrbitDB');
  accessControl: OwnerAccessControlService;
  proposals!: ProposalsProvider;

  constructor(
    protected orbitdbConnection: OrbitDBConnection,
    public store: IpfsStore
  ) {
    this.accessControl = new EveesAccessControlOrbitDB(
      this.orbitdbConnection,
      this.store
    );
  }

  get id() {
    return `orbitdb:${evees_if}`;
  }

  get defaultPath() {
    return '';
  }

  get userId() {
    return this.orbitdbConnection.instance.identity.id;
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([this.orbitdbConnection.ready()]);
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

    return perspectiveId;
  }

  async getPerspectiveStore(perspectiveId: string) {
    const { payload: perspective } = (await this.store.get(
      perspectiveId
    )) as Signed<Perspective>;
    return this.orbitdbConnection.perspectiveStore(perspective);
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    const canWrite = perspectiveData.canWrite;

    /** validate */
    if (!secured.object.payload.remote)
      throw new Error('remote cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    const perspectiveStore = await this.orbitdbConnection.perspectiveStore(
      secured.object.payload
    );

    await this.updatePerspective(perspectiveId, details);
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
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
      // await contextStore.delete(perspectiveId);
      await Promise.all([
        ...contextStore
          .iterator({ limit: -1 })
          .collect()
          .filter((e) => e.payload.value === perspectiveId)
          .map((e) => contextStore.remove(e.hash)),
      ]);
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
    const address = await this.orbitdbConnection.contextAddress(context);

    const open = !!this.orbitdbConnection.instance.stores[address];
    const contextStore = await this.orbitdbConnection.contextStore(context);
    // if (!open) await event(contextStore.events, 'replicated', { timeout });

    // const perspectiveIds = [...await contextStore.values()];
    const perspectiveIds = contextStore
      .iterator({ limit: -1 })
      .collect()
      .map((e) => e.payload.value);

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
    const { payload: perspective } = (await this.store.get(
      perspectiveId
    )) as Signed<Perspective>;
    const address = await this.orbitdbConnection.perspectiveAddress(
      perspective
    );

    const open = !!this.orbitdbConnection.instance.stores[address];
    const perspectiveStore = await this.orbitdbConnection.perspectiveStore(
      perspective
    );
    // if (!open) await pEvent(perspectiveStore.events, 'replicated', { timeout });

    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();

    return latestEntry ? latestEntry.payload.value : defaultDetails;
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    const perspectiveStore = await this.getPerspectiveStore(perspectiveId);

    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();
    const context = latestEntry && latestEntry.payload.value.context;

    await Promise.all([
      perspectiveStore.drop(),
      this.orbitdbConnection.instance.purgeContexts(perspectiveId),
    ]);
  }

  isLogged(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  login(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
