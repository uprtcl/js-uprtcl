import { ApolloClient, gql } from 'apollo-boost';
import { multiInject, injectable, inject } from 'inversify';
import { isEqual } from 'lodash-es';

import {
  PatternRecognizer,
  Hashed,
  IsSecure,
  HasChildren,
  CortexModule,
  Signed
} from '@uprtcl/cortex';
import {
  KnownSourcesService,
  DiscoveryService,
  DiscoveryModule,
  TaskQueue
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { computeIdOfEntity } from '@uprtcl/multiplatform';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Secured } from '../patterns/default-secured.pattern';
import { Perspective, Commit, PerspectiveDetails, RemotesConfig, UprtclAction, CreateDataAction, CREATE_DATA_ACTION, CREATE_COMMIT_ACTION, CreateCommitAction, CREATE_AND_INIT_PERSPECTIVE, CreateAndInitPerspectiveAction } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs = (
  | Partial<PerspectiveDetails>
  | (NoHeadPerspectiveArgs & { dataId: string })
) & { recursive?: boolean } & { canWrite?: string };

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(EveesBindings.Secured) protected secured: IsSecure<any>,
    @inject(DiscoveryModule.bindings.LocalKnownSources)
    public knownSources: KnownSourcesService,
    @inject(DiscoveryModule.bindings.DiscoveryService)
    protected discoveryService: DiscoveryService,
    @multiInject(EveesBindings.EveesRemote)
    protected eveesRemotes: EveesRemote[],
    @inject(ApolloClientModule.bindings.Client)
    protected client: ApolloClient<any>,
    @inject(EveesBindings.RemotesConfig)
    protected remotesConfig: RemotesConfig,
    @inject(DiscoveryModule.bindings.TaskQueue)
    protected taskQueue: TaskQueue
  ) {}

  /** Public functions */

  public getAuthority(authority: String | undefined): EveesRemote {
    if (!authority && this.eveesRemotes.length === 1) return this.eveesRemotes[0];

    const remote = this.eveesRemotes.find(remote => remote.authority === authority);

    if (!remote) throw new Error(`Authority ${authority}  is not registered`);

    return remote;
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its origin
   * @returns the uprtcl remote
   */
  public getPerspectiveProvider(perspective: Signed<Perspective>): EveesRemote {
    const perspectiveOrigin = perspective.payload.origin;

    return this.getAuthority(perspectiveOrigin);
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its origin
   * @returns the uprtcl remote
   */
  public async getPerspectiveProviderById(perspectiveId: String): Promise<EveesRemote> {
    const result = await this.client.query({
      query: gql`
        {
          entity(id: "${perspectiveId}") {
            id 
            ... on Perspective {
              payload {
                origin
              }
            }
          }
        }
      `
    });

    const perspectiveOrigin = result.data.entity.payload.origin;
    return this.getAuthority(perspectiveOrigin);
  }

  public async getContextPerspectives(context: string): Promise<string[]> {
    const promises = this.eveesRemotes.map(async (remote) => { 
      const thisPerspectivesIds = await remote.getContextPerspectives(context);
      thisPerspectivesIds.forEach(pId => {
        this.knownSources.addKnownSources(pId, [remote.source]);
      });
      return thisPerspectivesIds;
    });

    const perspectivesIds = await Promise.all(promises);

    return ([] as string[]).concat(...perspectivesIds);
  }

  /** Creators */

  /**
   * Creates a new perspective with the given arguments,
   * creating the context, data and commit if necessary
   *
   * @param args the properties of the perspectives
   * @param upl provider to which to create the perspective, needed if there is more than one provider
   */
  public async createPerspective(
    args: NewPerspectiveArgs,
    authority: string,
    currentActions: UprtclAction<any>[] // CAUTION: Updated by reference
  ): Promise<Secured<Perspective>> {

    const eveesRemote = this.getAuthority(authority);

    const name = args.name || ``;

    if (!eveesRemote.userId)
      throw new Error(
        `You need to be logged in the evees authority ${eveesRemote.authority} to create perspectives in it`
      );

    // Create the context to point the perspective to, if needed
    const context = args.context || `${Date.now()}${Math.random()}`;

    // Create the commit to point the perspective to, if needed
    let dataId = (args as { dataId: any }).dataId;
    let headId = (args as { headId: string }).headId;

    if (!dataId && !headId)
      throw new Error(
        'Either the headId or the dataId has to be provided to create the perspective'
      );

    if (args.recursive) {
      // Create recursive perspective to be able to write in the descendant perspectives
      if (!dataId) {
        const commit: Secured<Commit> | undefined = await this.discoveryService.get(headId);
        if (!commit) throw new Error('Head commit for the perspective was not found');

        dataId = commit.object.payload.dataId;
      }

      const dataHashed: Hashed<any> | undefined = await this.discoveryService.get(dataId);
      if (!dataHashed) throw new Error('Data for the head commit of the perspective was not found');

      const hasChildren: HasChildren | undefined = this.patternRecognizer
        .recognize(dataHashed)
        .find(prop => !!(prop as HasChildren).getChildrenLinks);

      if (hasChildren) {
        const descendantLinks = hasChildren.getChildrenLinks(dataHashed);

        if (descendantLinks.length > 0) {
          /** create a new perspective of the child
           * (this will recursively call this same createPerspective() function) */

          // TODO: generalize to break the assumption that all links are to perspectives
          const promises = descendantLinks.map(async link => {

            const getDetails = await this.client.query({
              query: gql`
                {
                  entity(id: "${link}") {
                    id
                    ... on Perspective {
                      context {
                        identifier
                      }
                      head {
                        id
                      }
                    }
                  }
                }
              `
            });

            if (!getDetails.data.entity.context) {
              throw new Error('Original perspective dont have a context');
            };

            const details = {
              context: getDetails.data.entity.context.identifier,
              headId: getDetails.data.entity.head ? getDetails.data.entity.head.id : ''
            };
            
            // const newPerspective = await this.client.mutate({
            //   mutation: CREATE_PERSPECTIVE,
            //   variables: {
            //     context: details.context,
            //     name,
            //     headId: details.headId,
            //     authority: eveesRemote.authority,
            //     canWrite: args.canWrite ? args.canWrite : undefined,
            //     recursive: true
            //   }
            // });

            const childArgs: NewPerspectiveArgs = {
              headId: headId,
              canWrite: args.canWrite ? args.canWrite : undefined,
              context: details.context,
              name: name,
              recursive: true
            }

            const perspective = await this.createPerspective(childArgs, eveesRemote.authority, currentActions);

            return perspective.id;
          });

          const newLinks = await Promise.all(promises);
          const newData: Hashed<any> = hasChildren.replaceChildrenLinks(dataHashed)(newLinks);
          const dataSource = this.remotesConfig.map(eveesRemote.authority, hasChildren.name);

          dataId = await computeIdOfEntity(this.patternRecognizer)(newData.object);

          const newDataAction: UprtclAction<CreateDataAction> = {
            id: dataId,
            type: CREATE_DATA_ACTION,
            payload: {
              data: newData.object,
              source: dataSource.source
            }
          }

          currentActions.unshift(newDataAction);
        }
      }
    }

    if (dataId) {
      // const result = await this.client.mutate({
      //   mutation: CREATE_COMMIT,
      //   variables: {
      //     dataId: dataId,
      //     message: `Commit at ${Date.now()}`,
      //     parentsIds: headId ? [headId] : [],
      //     source: eveesRemote.source
      //   }
      // });
      // headId = result.data.createCommit.id;
      const newCommit: Signed<Commit> = {
        payload: {
          dataId: dataId,
          message: `auto-commit for new perspective ${name}`,
          creatorsIds: [],
          parentsIds: headId ? [headId] : [],
          timestamp: Date.now()
        },
        proof: {
          signature: '',
          type: ''
        }
      }

      headId = await computeIdOfEntity(this.patternRecognizer)(newCommit);

      const newCommitAction: UprtclAction<CreateCommitAction> = {
        type: CREATE_COMMIT_ACTION,
        id: headId,
        payload: {
          commit: newCommit,
          source: eveesRemote.source
        }
      }

      currentActions.unshift(newCommitAction);

    }

    // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: eveesRemote.userId,
      origin: eveesRemote.authority,
      timestamp: Date.now()
    };
    const perspective: Secured<Perspective> = await this.secured.derive()(perspectiveData);

    // Clone the perspective in the selected provider
    // await eveesRemote.cloneAndInitPerspective(perspective, { headId, name, context }, args.canWrite);

    const newPerspectiveAction: UprtclAction<CreateAndInitPerspectiveAction> = {
      id: perspective.id,
      type: CREATE_AND_INIT_PERSPECTIVE,
      payload: {
        perspective: perspective,
        details: { headId, name, context },
        owner: args.canWrite ? args.canWrite : ''
      }
    }

    currentActions.unshift(newPerspectiveAction);

    this.logger.info('Computed new perspective action: ', perspective);
    
    return perspective;
  }
}
