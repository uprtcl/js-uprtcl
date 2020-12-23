import { html } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Signed } from '@uprtcl/cortex';
import { CASStore } from '@uprtcl/multiplatform';

import {
  Secured,
  Perspective,
  PerspectiveDetails,
  NewPerspectiveData,
  EveesRemote,
  ProposalsProvider,
  EveesHelpers,
} from '@uprtcl/evees';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { EveesAccessControlOrbitDB } from './evees-acl.orbit-db';
import {
  EveesOrbitDBEntities,
  perspective,
} from '../custom-stores/orbit-db.stores';
import { Lens } from '@uprtcl/lenses';
import { TemplateResult } from 'lit-html';

const evees_if = 'evees-v0';
// const timeout = 200;
const defaultDetails: PerspectiveDetails = {
  name: '',
  headId: undefined,
};

const notLogged = () => new Error('must be logged in to use this method');

const ENABLE_LOG = false;

export class EveesOrbitDB implements EveesRemote {
  logger: Logger = new Logger('EveesOrbitDB');
  accessControl: any;
  proposals!: ProposalsProvider;

  constructor(
    public orbitdbcustom: OrbitDBCustom,
    public store: CASStore,
    private postFix?: string
  ) {
    if (
      orbitdbcustom.getManifest(EveesOrbitDBEntities.Perspective) ===
        undefined ||
      orbitdbcustom.getManifest(EveesOrbitDBEntities.Context) === undefined
    ) {
      throw new Error(
        'orbitdb custom must include the EveesOrbitDBEntities.Perspective EveesOrbitDBEntities.Context stores'
      );
    }
    this.accessControl = new EveesAccessControlOrbitDB(this.store);
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

  canWrite(uref: string): Promise<boolean> {
    return this.accessControl.canWrite(uref, this.userId);
  }

  icon(): TemplateResult {
    return html`
      <div style="display: flex;align-items: center">
        <img
          style="height: 28px; width: 28px;margin-right: 6px"
          src="https://orbitdb.org/images/favicon.png"
        />
        orbitdb
      </div>
    `;
  }

  avatar(userId: string, config: any = { showName: true }) {
    return html`<orbitdb-profile
      address=${userId}
      ?show-name=${config.showName}
    >
    </orbitdb-profile> `;
  }

  lense(): Lens {
    return {
      name: 'evees-orbitb:remote',
      type: 'remote',
      render: (entity: any) => {
        return html`
          <evees-orbitdb-remote
            remote-id=${entity.remoteId}
          ></evees-orbitdb-remote>
        `;
      },
    };
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([this.orbitdbcustom.ready(), this.store.ready()]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.store.create(secured.object);
    if (ENABLE_LOG) {
      this.logger.log(
        `[OrbitDB] persistPerspectiveEntity - added to IPFS`,
        perspectiveId
      );
    }

    if (secured.id && secured.id !== perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    if (ENABLE_LOG) {
      this.logger.log('persisting', secured);
    }

    return perspectiveId;
  }

  async getPerspectiveStore(perspectiveId: string, pin: boolean = false) {
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const signedPerspective = (await this.store.get(perspectiveId)) as Signed<
      Perspective
    >;

    if (ENABLE_LOG) {
      this.logger.log('getting', { perspectiveId, signedPerspective });
    }

    const secured: Secured<Perspective> = {
      id: perspectiveId,
      object: signedPerspective,
    };
    return this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Perspective,
      secured,
      pin
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
    let parentOwner: string | undefined = undefined;
    if (parentId !== undefined) {
      parentOwner = await this.accessControl.getOwner(parentId);
    }
    const perspective = await EveesHelpers.snapDefaultPerspective(
      this,
      parentOwner,
      context,
      timestamp,
      path,
      fromPerspectiveId,
      fromHeadId
    );
    perspective.casID = this.store.casID;

    return perspective;
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    if (ENABLE_LOG) {
      this.logger.log('createPerspective', perspectiveData);
    }

    if (!(await this.isLogged())) throw notLogged();
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    // const canWrite = perspectiveData.canWrite;

    /** validate */
    if (!secured.object.payload.remote)
      throw new Error('remote cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    await this.updatePerspectiveInternal(perspectiveId, details, true);

    /** create and pin the context store */
    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context: secured.object.payload.context,
      },
      true
    );
    await contextStore.add(perspectiveId);
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    if (!(await this.isLogged())) throw notLogged();
    await Promise.all(
      newPerspectivesData.map(this.createPerspective.bind(this))
    );
  }

  public async updatePerspective(
    perspectiveId: string,
    details: PerspectiveDetails
  ) {
    return this.updatePerspectiveInternal(perspectiveId, details, false);
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
    if (details.name) throw new Error('details.name is not supported');

    const currentDetails: PerspectiveDetails = await this.getPerspective(
      perspectiveId
    );

    details = Object.keys(details).reduce(
      (a, c) => (details[c] === undefined ? a : { ...a, [c]: details[c] }),
      {}
    );

    const newDetails: PerspectiveDetails = { ...currentDetails, ...details };

    const headChange = currentDetails.headId !== newDetails.headId;

    if (headChange) {
      const perspectiveStore = await this.getPerspectiveStore(
        perspectiveId,
        pin
      );
      await perspectiveStore.add(newDetails);
    }

    if (ENABLE_LOG) {
      this.logger.log('updatePerspective - done', { perspectiveId, details });
    }
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    if (ENABLE_LOG) {
      this.logger.log('getContextPerspectives', { context });
    }
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context,
      }
    );
    const perspectiveIds = [...contextStore.values()];
    if (ENABLE_LOG) {
      this.logger.log('getContextPerspectives - done ', {
        context,
        perspectiveIds,
      });
    }
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
    if (!this.orbitdbcustom) throw new Error('orbit db connection undefined');

    const signedPerspective = (await this.store.get(perspectiveId)) as Signed<
      Perspective
    >;
    const contextStore = await this.orbitdbcustom.getStore(
      EveesOrbitDBEntities.Context,
      {
        context: signedPerspective.payload.context,
      }
    );
    await contextStore.delete(perspectiveId);

    /** drop and unpin */
    const secured: Secured<Perspective> = {
      id: perspectiveId,
      object: signedPerspective,
    };
    await this.orbitdbcustom.dropStore(
      EveesOrbitDBEntities.Perspective,
      secured
    );
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
