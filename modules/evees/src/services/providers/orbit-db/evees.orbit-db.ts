import { Container } from 'inversify';

import { Logger } from '@uprtcl/micro-orchestrator';
import { OrbitDBConnection } from '@uprtcl/orbit-db-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import {
  IpfsStore,
  sortObject,
  IpfsConnectionOptions,
} from '@uprtcl/ipfs-provider';
import { CidConfig } from '@uprtcl/multiplatform';
import { Authority } from '@uprtcl/access-control';

import { Secured } from '../../../utils/cid-hash';
import {
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
} from '../../../types';
import { EveesRemote } from '../../evees.remote';
import { EveesAccessControlOrbitDB } from './evees-access-control.orbit-db';
import pEvent from 'p-event';

const evees_if = 'evees-v0';
const timeout = 200
const defaultDetails: PerspectiveDetails =
  { name: '', context: undefined, headId: undefined }

export class EveesEthereum extends IpfsStore
  implements EveesRemote, Authority, PerspectiveCreator {
  logger: Logger = new Logger('EveesEtereum');

  constructor(
    protected orbitdbConnection: OrbitDBConnection,
    protected ethConnection: EthereumConnection,
    protected ipfsOptions: IpfsConnectionOptions,
    cidConfig: CidConfig,
    container: Container
  ) {
    super(ipfsOptions, cidConfig);

    this.accessControl = new EveesAccessControlOrbitDB(
      this.orbitdbConnection,
      this.get.bind(this)
    )
  }

  get authority() {
    return `orbitdb:${evees_if}`;
  }

  get userId() {
    return this.orbitdbConnection.instance.identity.id;
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([
      super.ready(),
      this.orbitdbConnection.ready()
    ]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.create(secured.object);
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

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    const canWrite = perspectiveData.canWrite;

    /** validate */
    if (!secured.object.payload.authority)
      throw new Error('authority cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    const perspectiveStore =
      await this.orbitdbConnection.perspectiveStore(secured.object.payload);

    await this.updatePerspective(details);
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
    if (datails.name) throw new Error('details.name is not supported');
    const currentDetails: PerspectiveDetails = await this.getPerspective(perspectiveId);

    details = Object.keys(details)
      .reduce((a, c) => details[c] === undefined ? a : { ...a, [c]: details[c] }, {});

    const newDetails: PerspectiveDetails = { ...currentDetails, ...details };

    const { payload: perspective } = await this.get(perspectiveId);
    const perspectiveStore = await this.orbitdbConnection.perspectiveStore(perspective);
    await perspectiveStore.add(newDetails);

    const contextChange = currentDetails.context !== newDetails.context;

    if (contextChange && currentDetails.context) {
      const contextStore = await this.orbitdbConnection.contextStore(currentDetails.context);
      // await contextStore.delete(perspectiveId);
      await Promise.all([
        ...contextStore.iterator({ limit: -1 }).collect()
          .filter(e => e.payload.value === perspectiveId)
          .map(e => contextStore.remove(e.hash))
      ]);
    }
    if (contextChange && newDetails.context) {
      const contextStore = await this.orbitdbConnection.contextStore(newDetails.context);
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
    if (!open) await event(contextStore.events, 'replicated', { timeout });

    // const perspectiveIds = [...await contextStore.values()];
    const perspectiveIds = contextStore.iterator({ limit: -1 }).collect()
      .map(e => e.payload.value);


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
    const { payload: perspective } = await this.get(perspectiveId);
    const address = await this.orbitdbConnection.perspectiveAddress(perspective);

    const open = !!this.orbitdbConnection.instance.stores[address];
    const perspectiveStore =
      await this.orbitdbConnection.perspectiveStore(perspective);
    if (!open) await pEvent(perspectiveStore.events, 'replicated', { timeout });

    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();

    return latestEntry
      ? latestEntry.payload.value
      : defaultDetails;
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    const { payload: perspective } = await this.get(perspectiveId);
    const perspectiveStore =
      await this.orbitdbConnection.perspectiveStore(perspective);

    const [latestEntry] = perspectiveStore.iterator({ limit: 1 }).collect();
    const context = latestEntry && latestEntry.payload.value.context;

    await Promise.all([
      perspectiveStore.drop(),
      this.orbitdbConnection.purgeContexts(perspectiveId)
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
