import { multiInject, injectable, inject } from 'inversify';

import {
  DiscoverableSource,
  KnownSourcesService,
  DiscoveryTypes,
  PatternTypes,
  PatternRecognizer,
  Secured,
  Creatable,
  CachedMultiSourceService,
  Hashed,
  IsSecure,
  MultiSourceService
} from '@uprtcl/cortex';
import { MicroOrchestratorTypes, Logger } from '@uprtcl/micro-orchestrator';

import { UprtclTypes, UprtclLocal, Perspective, Commit } from '../../types';
import { UprtclProvider } from './uprtcl.provider';
import { UprtclRemote } from './uprtcl.remote';

export interface PerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs =
  | PerspectiveArgs
  | (PerspectiveArgs & { headId: string })
  | (PerspectiveArgs & { dataId: string })
  | (PerspectiveArgs & { data: any });

const creatorId = 'did:hi:ho';
const DEFAULT_PERSPECTIVE_NAME = 'master';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Uprtcl {
  logger = new Logger('uprtcl');

  service: CachedMultiSourceService<UprtclLocal, UprtclRemote>;

  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(PatternTypes.Core.Secured) protected secured: IsSecure<any>,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected knownSources: KnownSourcesService,
    @inject(UprtclTypes.UprtclLocal)
    protected uprtclLocal: UprtclLocal,
    @multiInject(UprtclTypes.UprtclRemote)
    protected uprtclRemotes: DiscoverableSource<UprtclRemote>[]
  ) {
    this.service = new CachedMultiSourceService<UprtclLocal, UprtclRemote>(
      uprtclLocal,
      new MultiSourceService<UprtclRemote>(patternRecognizer, knownSources, uprtclRemotes)
    );
  }

  /**
   * @override
   */
  public ready(): Promise<void> {
    return this.service.ready();
  }

  /** Private functions */

  /**
   * If the provider name is undefined and there are more than one provider, throws error
   * Else, return the provider name that should be used
   * @param providerName optional provider name to validate
   */
  private validateProviderName(providerName?: string): string {
    if (!providerName) {
      const sourcesNames = this.service.remote.getAllServicesNames();
      if (sourcesNames.length > 1) {
        throw new Error(
          'Provider name cannot be empty, since we have more than one provider registered'
        );
      }

      providerName = sourcesNames[0];
    }
    return providerName as string;
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its origin
   * @returns the uprtcl remote
   */
  public getPerspectiveProvider(perspective: Secured<Perspective>): UprtclRemote {
    const perspectiveOrigin = perspective.object.payload.origin;

    const provider = this.service.remote
      .getAllServices()
      .find(provider => provider.name === perspectiveOrigin);

    if (!provider)
      throw new Error(
        `Provider ${perspectiveOrigin} for perspective ${perspective.id} is not registered`
      );

    return provider;
  }

  /** Getters */

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.service.get(hash);
  }

  /**
   * @override
   */
  public async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    return this.service.remote.getArrayFromAllServices(uprtcl =>
      uprtcl.getContextPerspectives(context)
    );
  }

  /**
   * @override
   */
  public async getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    const localHead = await this.uprtclLocal.getPerspectiveHead(perspectiveId);
    if (localHead) return localHead;

    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective) return undefined;

    const provider = this.getPerspectiveProvider(perspective);

    return provider.getPerspectiveHead(perspectiveId);
  }

  /**
   * @override
   */
  public async getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective) return undefined;

    const provider = this.getPerspectiveProvider(perspective);

    return provider.getPerspectiveContext(perspectiveId);
  }

  /** Creators */

  /**
   * Creates a new perspective with the given arguments,
   * creating the context, data and commit if necessary
   *
   * @param args the properties of the perspectives
   * @param providerName provider to which to create the perspective, needed if there are more than one provider
   */
  public async createPerspective(
    args: NewPerspectiveArgs,
    providerName?: string
  ): Promise<Secured<Perspective>> {
    const name = args.name || DEFAULT_PERSPECTIVE_NAME;

    providerName = this.validateProviderName(providerName);

    // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: creatorId,
      name: name,
      origin: providerName,
      timestamp: Date.now()
    };
    const perspective: Secured<Perspective> = await this.secured.derive(perspectiveData);

    this.logger.info('Created new perspective: ', perspective);

    // Clone the perspective in the selected provider
    await this.clonePerspective(perspective, providerName);

    // Create the context to point the perspective to, if needed
    const context = args.context || `${Date.now()}${Math.random()}`;

    await this.updatePerspectiveContext(perspective.id, context);

    // Create the data and commit to point the perspective to, if needed

    let data = (args as { data: any }).data;
    let dataId = (args as { dataId: any }).dataId;
    let headId = (args as { headId: string }).headId;

    if (data) {
      const createdData = await this.createData(data);
      dataId = createdData.id;
    }

    if (dataId) {
      const head = await this.createCommit(
        {
          dataId: dataId,
          message: `Commit at ${Date.now() / 1000}`,
          parentsIds: headId ? [headId] : []
        },
        providerName
      );
      headId = head.id;
    }

    // Set the perspective head if given
    if (headId) {
      await this.updatePerspectiveHead(perspective.id, headId);
    }

    return perspective;
  }

  /**
   * Create a new commit with the given properties
   *
   * @param args the properties of the commit
   * @param providerName the provider to which to create the commit, needed if there are more than one provider
   */
  public async createCommit(
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      timestamp?: number;
    },
    providerName?: string
  ): Promise<Secured<Commit>> {
    providerName = this.validateProviderName(providerName);

    const timestamp = args.timestamp || Date.now();

    const commitData: Commit = {
      creatorId: creatorId,
      dataId: args.dataId,
      message: args.message,
      timestamp: timestamp,
      parentsIds: args.parentsIds
    };
    const commit: Secured<Commit> = await this.secured.derive(commitData);

    this.logger.info('Created new commit: ', commit);

    await this.cloneCommit(commit, providerName);

    return commit;
  }

  /** Cloners */

  /**
   * Clones the given perspective in the given provider
   *
   * @param perspective the perspective to clone
   * @param providerName the provider to which to clone the perspective to, needed if there are more than one provider
   */
  public async clonePerspective(
    perspective: Secured<Perspective>,
    providerName?: string
  ): Promise<void> {
    providerName = this.validateProviderName(providerName);

    const creator = async (uprtcl: UprtclProvider) => {
      await uprtcl.clonePerspective(perspective);
      return perspective;
    };
    const cloner = async (uprtcl: UprtclProvider, perspective: Secured<Perspective>) => {
      await uprtcl.clonePerspective(perspective);
      return perspective;
    };

    await this.service.optimisticCreateIn(providerName, creator, cloner);
    this.logger.info('Cloned the perspective: ', perspective.id);
  }

  /**
   * Clones the given commit in the given provider
   *
   * @param commit the commit to clone
   * @param providerName the provider to which to clone the commit to, needed if there are more than one provider
   */
  public async cloneCommit(commit: Secured<Commit>, providerName?: string): Promise<void> {
    providerName = this.validateProviderName(providerName);

    const creator = async (uprtcl: UprtclProvider) => {
      await uprtcl.cloneCommit(commit);
      return commit;
    };
    const cloner = async (uprtcl: UprtclProvider, object: Secured<Commit>) => {
      await uprtcl.cloneCommit(object);
      return commit;
    };

    await this.service.optimisticCreateIn(providerName, creator, cloner);
    this.logger.info('Cloned the commit: ', commit);
  }

  /** Modifiers */

  public async updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective) return undefined;

    const provider = this.getPerspectiveProvider(perspective);

    const updater = (uprtcl: UprtclProvider) => uprtcl.updatePerspectiveHead(perspectiveId, headId);

    this.service.optimisticUpdateIn(
      provider.name,
      perspective,
      updater,
      updater,
      `Update head of ${perspective.id}`,
      perspectiveId
    );
  }

  public async updatePerspectiveContext(perspectiveId: string, context: string): Promise<void> {
    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective) return undefined;

    const provider = this.getPerspectiveProvider(perspective);

    const updater = (uprtcl: UprtclProvider) =>
      uprtcl.updatePerspectiveContext(perspective.id, context);
    await this.service.optimisticUpdateIn(
      provider.name,
      perspective,
      updater,
      updater,
      `Update context of ${perspective.id}`,
      perspective.id
    );
  }

  /** Helper functions */

  public async createData<O extends object>(data: O): Promise<Hashed<O>> {
    const dataPattern: Creatable<O, any> = this.patternRecognizer.recognizeMerge(data);

    if (!dataPattern.create) throw new Error('Cannot create this type of data');

    this.logger.info('Creating the data: ', data);

    return dataPattern.create(data);
  }
}
