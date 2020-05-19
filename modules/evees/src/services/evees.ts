import { ApolloClient, gql } from 'apollo-boost';
import { multiInject, injectable, inject } from 'inversify';

import { PatternRecognizer, HasChildren, CortexModule, Signed } from '@uprtcl/cortex';
import { loadEntity } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective, Commit, RemoteMap } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { Secured, deriveEntity } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';
import { EveesWorkspace } from './evees.workspace';
import { EveesHelpers } from '../graphql/helpers';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @multiInject(EveesBindings.EveesRemote)
    protected eveesRemotes: EveesRemote[],
    @inject(ApolloClientModule.bindings.Client)
    protected client: ApolloClient<any>,
    @inject(EveesBindings.DefaultRemote)
    protected defaultRemote: EveesRemote,
    @inject(EveesBindings.RemoteMap)
    protected remoteMap: RemoteMap
  ) {}

  /** Public functions */

  public getAuthority(authority: string | undefined): EveesRemote {
    if (!authority && this.eveesRemotes.length === 1) return this.eveesRemotes[0];

    const remote = this.eveesRemotes.find((remote) => remote.authority === authority);

    if (!remote) throw new Error(`Authority ${authority}  is not registered`);

    return remote;
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its authority
   * @returns the uprtcl remote
   */
  public getPerspectiveProvider(perspective: Signed<Perspective>): EveesRemote {
    const perspectiveOrigin = perspective.payload.authority;

    return this.getAuthority(perspectiveOrigin);
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its authority
   * @returns the uprtcl remote
   */
  public async getPerspectiveProviderById(perspectiveId: String): Promise<EveesRemote> {
    const result = await this.client.query({
      query: gql`
        {
          entity(ref: "${perspectiveId}") {
            id 
            ... on Perspective {
              payload {
                authority
              }
            }
          }
        }
      `,
    });

    const perspectiveOrigin = result.data.entity.payload.authority;
    return this.getAuthority(perspectiveOrigin);
  }

  public async isPerspective(id: string): Promise<boolean> {
    const entity = await loadEntity(this.client, id);
    if (entity === undefined) throw new Error('entity not found');
    const type = this.recognizer.recognizeType(entity);
    return type === 'Perspective';
  }

  async isPattern(id: string, type: string): Promise<boolean> {
    const entity = await loadEntity(this.client, id);
    if (entity === undefined) throw new Error('entity not found');
    const recognizedType = this.recognizer.recognizeType(entity);
    return type === recognizedType;
  }

  /**
   * receives an entity id and compute the actions that will
   * result on this entity being forked on a target authority
   * with a target owner (canWrite).
   *
   * it also makes sure that all entities are clonned
   * on the target authority default store.
   *
   * recursively fork entity children
   */
  public async fork(
    id: string,
    workspace: EveesWorkspace,
    authority: string,
    canWrite: string,
    parentId?: string
  ): Promise<string> {
    const isPerspective = await this.isPattern(id, EveesBindings.PerspectiveType);
    if (isPerspective) {
      return this.forkPerspective(id, workspace, authority, canWrite, parentId);
    } else {
      const isCommit = await this.isPattern(id, EveesBindings.CommitType);
      if (isCommit) {
        return this.forkCommit(id, workspace, authority, canWrite, parentId);
      } else {
        return this.forkEntity(id, workspace, authority, canWrite, parentId);
      }
    }
  }

  getEntityChildren(entity: object) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.getChildrenLinks(entity);
    }
  }

  replaceEntityChildren(entity: object, newLinks: string[]) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      throw new Error(`entity dont hasChildren ${JSON.stringify(entity)}`);
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  public async forkPerspective(
    perspectiveId: string,
    workspace: EveesWorkspace,
    authority?: string,
    canWrite?: string,
    parentId?: string,
    name?: string
  ): Promise<string> {
    const eveesRemote = authority !== undefined ? this.getAuthority(authority) : this.defaultRemote;
    canWrite =
      canWrite !== undefined
        ? canWrite
        : eveesRemote.userId !== undefined
        ? eveesRemote.userId
        : '';

    const object: Perspective = {
      creatorId: eveesRemote.userId ? eveesRemote.userId : '',
      authority: eveesRemote.authority,
      timestamp: Date.now(),
    };

    const perspective: Secured<Perspective> = await deriveSecured(object, eveesRemote.cidConfig);

    const headId = await EveesHelpers.getPerspectiveHeadId(this.client, perspectiveId);
    const context = await EveesHelpers.getPerspectiveContext(this.client, perspectiveId);

    const forkCommitId = await this.forkCommit(
      headId,
      workspace,
      eveesRemote.authority,
      canWrite,
      perspective.id // this perspective is set as the parent of the children's new perspectives
    );

    workspace.newPerspective({
      perspective,
      details: { headId: forkCommitId, name, context },
      canWrite: canWrite,
      parentId,
    });

    return perspective.id;
  }

  public async forkCommit(
    commitId: string,
    workspace: EveesWorkspace,
    authority: string,
    canWrite: string,
    parentId?: string // used by forkEntity which forks the children
  ): Promise<string> {
    const commit: Secured<Commit> | undefined = await loadEntity(this.client, commitId);
    if (!commit) throw new Error(`Could not find commit with id ${commitId}`);

    const remote = this.getAuthority(authority);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, workspace, authority, canWrite, parentId);

    const eveesRemote = this.getAuthority(authority);

    /** build new head object pointing to new data */
    const newCommit: Commit = {
      creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
      dataId: dataForkId,
      message: `autocommit to fork ${commitId} on authority ${authority}`,
      parentsIds: [commitId],
      timestamp: Date.now(),
    };

    const newHead: Secured<Commit> = await deriveSecured(newCommit, remote.cidConfig);
    newHead.casID = remote.casID;
    workspace.create(newHead);

    return newHead.id;
  }

  public async forkEntity(
    entityId: string,
    workspace: EveesWorkspace,
    authority: string,
    canWrite: string,
    parentId?: string
  ): Promise<string> {
    const data = await loadEntity(this.client, entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const getLinksForks = this.getEntityChildren(data).map((link) =>
      this.fork(link, workspace, authority, canWrite, parentId)
    );
    const newLinks = await Promise.all(getLinksForks);
    const tempData = this.replaceEntityChildren(data, newLinks);

    const remote = this.eveesRemotes.find((r) => r.authority === authority);
    if (!remote)
      throw new Error(`Could not find registered evees remote for authority with ID ${authority}`);

    const store = this.remoteMap(remote, this.recognizer.recognizeType(data));

    const newData = await deriveEntity(tempData.object, store.cidConfig);

    newData.casID = store.casID;
    workspace.create(newData);

    return newData.id;
  }
}
