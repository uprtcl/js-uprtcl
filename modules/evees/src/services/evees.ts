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
import { KnownSourcesService, DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { createEntity } from '@uprtcl/multiplatform';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Secured } from '../patterns/default-secured.pattern';
import { Perspective, Commit, PerspectiveDetails, RemotesConfig } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { CREATE_PERSPECTIVE, CREATE_COMMIT } from '../graphql/queries';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs = (
  | Partial<PerspectiveDetails>
  | (NoHeadPerspectiveArgs & { dataId: string })
) & { recursive?: boolean };

const DEFAULT_PERSPECTIVE_NAME = 'first';

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

  public async getContextPerspectives(context: string): Promise<Array<Secured<Perspective>>> {
    const promises = this.eveesRemotes.map(remote => remote.getContextPerspectives(context));
    const perspectives = await Promise.all(promises);

    return ([] as Secured<Perspective>[]).concat(...perspectives);
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
    authority?: string
  ): Promise<Secured<Perspective>> {
    const name = args.name || DEFAULT_PERSPECTIVE_NAME;

    const eveesRemote = this.getAuthority(authority);

    if (!eveesRemote.userId)
      throw new Error(`You need to be logged in the evees authority ${eveesRemote.authority} to create perspectives in it`);

      // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: eveesRemote.userId,
      origin: eveesRemote.authority,
      timestamp: Date.now()
    };
    const perspective: Secured<Perspective> = await this.secured.derive()(perspectiveData);

    this.logger.info('Created new perspective: ', perspective);

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
            const details = await eveesRemote.getPerspectiveDetails(link);
            const newPerspective = await this.client.mutate({
              mutation: CREATE_PERSPECTIVE,
              variables: {
                context: details.context,
                name,
                headId: details.headId,
                authority: eveesRemote.authority,
                recursive: true
              }
            });
            return newPerspective.data.createPerspective.id;
          });

          const newLinks = await Promise.all(promises);
          const newData: Hashed<any> = hasChildren.replaceChildrenLinks(dataHashed)(newLinks);
          const dataSource = this.remotesConfig.map(eveesRemote.authority, hasChildren.name);
          dataId = await createEntity(this.patternRecognizer)(newData.object, dataSource.source);
        }
      }
    }

    if (dataId) {
      const result = await this.client.mutate({
        mutation: CREATE_COMMIT,
        variables: {
          dataId: dataId,
          message: `Commit at ${Date.now()}`,
          parentsIds: headId ? [headId] : [],
          source: eveesRemote.source
        }
      });
      headId = result.data.createCommit.id;
    }

    // Clone the perspective in the selected provider
    await eveesRemote.clonePerspective(perspective);

    // And update its details
    await eveesRemote.updatePerspectiveDetails(perspective.id, { headId, name, context });

    return perspective;
  }
}
