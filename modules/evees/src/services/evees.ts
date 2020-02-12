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
import {
  Perspective,
  Commit,
  PerspectiveDetails,
  RemotesConfig,
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { CidHashedPattern } from 'src/patterns/cid-hashed.pattern';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type CreatePerspectiveArgs = {
  canWrite?: string;
} & (
  | { newPerspective: NewPerspectiveArgs }
  | { fromDetails: { headId: string; context?: string; name?: string } }
);

export interface NewPerspectiveArgs {
  autority: string;
  timestamp?: number;
}

export interface CreateCommitArgs {
  parentsIds?: string[];
  dataId: string;
  creatorsIds?: string[];
  timestamp?: number;
  message?: string;
}

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(EveesBindings.Secured) protected secured: IsSecure<any>,
    @inject(EveesBindings.Hashed) protected hashed: CidHashedPattern,
    @inject(DiscoveryModule.bindings.LocalKnownSources)
    public knownSources: KnownSourcesService,
    @inject(DiscoveryModule.bindings.DiscoveryService)
    protected discoveryService: DiscoveryService,
    @multiInject(EveesBindings.EveesRemote)
    protected eveesRemotes: EveesRemote[],
    @inject(ApolloClientModule.bindings.Client)
    protected client: ApolloClient<any>,
    @inject(EveesBindings.RemotesConfig)
    protected remotesConfig: RemotesConfig
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
    const promises = this.eveesRemotes.map(async remote => {
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
  public async computeNewGlobalPerspectiveOps(
    authority: string,
    details: PerspectiveDetails,
    canWrite?: string
  ): Promise<[Secured<Perspective>, Array<UprtclAction>]> {
    const eveesRemote = this.getAuthority(authority);

    if (!eveesRemote.userId)
      throw new Error(`Cannot create perspectives on remotes you aren't signed in`);

    let actions: Array<UprtclAction> = [];

    const result = await this.client.query({
      query: gql`{
        entity(id: "${details.headId}") {
          id
          ... on Commit {
            data {
              id
              _context {
                raw
              }
            }
          }
        }
      }`
    });

    const headId = result.data.entity.id;
    const dataId = result.data.entity.data.id;
    const dataRaw = JSON.parse(result.data.entity.data._context.raw);
    const dataHashed = { id: dataId, object: dataRaw };

    let newHeadId = headId;

    const hasChildren: HasChildren | undefined = this.patternRecognizer
      .recognize(dataHashed)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (hasChildren) {
      const descendantLinks = hasChildren.getChildrenLinks(dataHashed);

      if (descendantLinks.length > 0) {
        const promises = descendantLinks.map(async link => {
          const descendantResult = await this.client.query({
            query: gql`{
              entity(id: "${link}") {
                id
                ... on Perspective {
                  head {
                    id
                  }
                  name
                  context {
                    id
                  }
                }
              }
            }`
          });

          const perspectiveDetails: PerspectiveDetails = {
            context: descendantResult.data.entity.context.id,
            headId: descendantResult.data.entity.head.id,
            name: descendantResult.data.entity.name
          };

          return this.computeNewGlobalPerspectiveOps(authority, perspectiveDetails, canWrite);
        });

        const results = await Promise.all(promises);

        actions = actions.concat(...results.map(r => r[1]));

        const newLinks = results.map(r => r[0].id);

        const newData: Hashed<any> = hasChildren.replaceChildrenLinks(dataHashed)(newLinks);
        const dataSource = this.remotesConfig.map(eveesRemote.authority, hasChildren.name);

        const newHasheData = await this.hashed.derive()(newData.object, dataSource.hashRecipe);

        const newDataAction: UprtclAction = {
          type: CREATE_DATA_ACTION,
          entity: newHasheData,
          payload: {
            source: dataSource.source
          }
        };

        actions.push(newDataAction);

        const newCommit: Commit = {
          dataId: newHasheData.id,
          message: `auto-commit for new perspective ${name}`,
          creatorsIds: [eveesRemote.userId],
          parentsIds: headId ? [headId] : [],
          timestamp: Date.now()
        };

        const securedCommit = await this.secured.derive()(newCommit, eveesRemote.hashRecipe);

        const newCommitAction: UprtclAction = {
          type: CREATE_COMMIT_ACTION,
          entity: securedCommit,
          payload: {
            source: eveesRemote.source
          }
        };

        newHeadId = securedCommit.id;

        actions.push(newCommitAction);
      }
    }
    // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: eveesRemote.userId,
      origin: eveesRemote.authority,
      timestamp: Date.now()
    };
    const perspective: Secured<Perspective> = await this.secured.derive()(
      perspectiveData,
      eveesRemote.hashRecipe
    );

    const newPerspectiveAction: UprtclAction = {
      type: CREATE_AND_INIT_PERSPECTIVE_ACTION,
      entity: perspective,
      payload: {
        details: { headId: newHeadId, name, context: details.context },
        owner: canWrite || eveesRemote.userId
      }
    };

    actions.push(newPerspectiveAction);

    return [perspective, actions];
  }
}
