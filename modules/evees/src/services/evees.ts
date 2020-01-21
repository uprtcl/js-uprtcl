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
import { Secured, createEntity, CorePatterns, ApolloClientModule } from '@uprtcl/common';

import { Perspective, Commit, PerspectiveDetails } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { ApolloClient, gql } from 'apollo-boost';
import { CREATE_PERSPECTIVE, CREATE_COMMIT } from 'src/graphql/queries';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs = (
  | Partial<PerspectiveDetails>
  | (NoHeadPerspectiveArgs & { dataId: string })
) & { disableRecursive?: boolean };

const DEFAULT_PERSPECTIVE_NAME = 'master';
const creatorId = 'did:hi:ho';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(CorePatterns.Secured) protected secured: IsSecure<any>,
    @inject(DiscoveryModule.bindings.LocalKnownSources)
    public knownSources: KnownSourcesService,
    @inject(DiscoveryModule.bindings.DiscoveryService)
    protected discoveryService: DiscoveryService,
    @multiInject(EveesBindings.EveesRemote)
    protected eveesRemotes: EveesRemote[],
    @inject(ApolloClientModule.bindings.Client)
    protected client: ApolloClient<any>
  ) {}

  /** Public functions */

  private getAuthority(authority: String | undefined): EveesRemote {
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

    // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: creatorId,
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

    if (!args.disableRecursive) {
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

        // TODO: generalize to break the assumption that all links are to perspectives
        const promises = descendantLinks.map(async link => {
          const details = await eveesRemote.getPerspectiveDetails(link);
          const newPerspective = await this.client.mutate({
            mutation: CREATE_PERSPECTIVE,
            variables: {
              context,
              name,
              headId: details.headId,
              authority: eveesRemote.authority
            }
          });
          return newPerspective.data.createPerspective.id;
        });

        const newLinks = await Promise.all(promises);
        const newData: Hashed<any> = hasChildren.replaceChildrenLinks(dataHashed)(newLinks);

        if (!isEqual(dataHashed, newData)) {
          const previousDataUpls = await this.knownSources.getKnownSources(dataId);

          const newDataId = await createEntity(this.patternRecognizer)(
            newData.object,
            previousDataUpls ? previousDataUpls[0] : undefined
          );
          dataId = newDataId;
        } else {
          dataId = undefined;
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

    return perspective;
  }
}
