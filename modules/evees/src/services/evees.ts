import { ApolloClient, gql } from 'apollo-boost';
import { multiInject, injectable, inject } from 'inversify';

import { PatternRecognizer, HasChildren, CortexModule, Signed } from '@uprtcl/cortex';
import { loadEntity } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective, Commit, EveesConfig } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { Secured, deriveEntity } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';
import { EveesWorkspace } from './evees.workspace';
import { EveesHelpers } from '../graphql/evees.helpers';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer)
    protected recognizer: PatternRecognizer,
    @multiInject(EveesBindings.EveesRemote)
    protected eveesRemotes: EveesRemote[],
    @inject(ApolloClientModule.bindings.Client)
    protected client: ApolloClient<any>,
    @inject(EveesBindings.Config)
    protected config: EveesConfig
  ) {}

  /** Public functions */

  public getRemote(remote: string | undefined): EveesRemote {
    if (!remote && this.eveesRemotes.length === 1) return this.eveesRemotes[0];

    const remoteInstance = this.eveesRemotes.find(instance => instance.id === remote);

    if (!remoteInstance) throw new Error(`Remote ${remote}  is not registered`);

    return remoteInstance;
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its remote
   * @returns the uprtcl remote
   */
  public getPerspectiveProvider(perspective: Signed<Perspective>): EveesRemote {
    return this.getRemote(perspective.payload.remote);
  }

  /**
   * Returns the uprtcl remote that controls the given perspective, from its remote
   * @returns the uprtcl remote
   */
  public async getPerspectiveRemoteById(perspectiveId: String): Promise<EveesRemote> {
    const result = await this.client.query({
      query: gql`
        {
          entity(uref: "${perspectiveId}") {
            id
            ... on Perspective {
              payload {
                remote
              }
            }
          }
        }
      `
    });

    // TODO: this throws: cannot read property entity of null
    const remote = result.data.entity.payload.remote;
    return this.getRemote(remote);
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
   * result on this entity being forked on a target remote
   * with a target owner (canWrite).
   *
   * it also makes sure that all entities are clonned
   * on the target remote default store.
   *
   * recursively fork entity children
   */
  public async fork(
    id: string,
    workspace: EveesWorkspace,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const isPerspective = await this.isPattern(id, EveesBindings.PerspectiveType);
    if (isPerspective) {
      return this.forkPerspective(id, workspace, remote, parentId);
    } else {
      const isCommit = await this.isPattern(id, EveesBindings.CommitType);
      if (isCommit) {
        return this.forkCommit(id, workspace, remote, parentId);
      } else {
        return this.forkEntity(id, workspace, remote, parentId);
      }
    }
  }

  getEntityChildren(entity: object) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.getChildrenLinks(entity);
    }
  }

  replaceEntityChildren(entity: object, newLinks: string[]) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      throw new Error(`entity dont hasChildren ${JSON.stringify(entity)}`);
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  public async forkPerspective(
    perspectiveId: string,
    workspace: EveesWorkspace,
    remote?: string,
    parentId?: string,
    name?: string
  ): Promise<string> {
    const eveesRemote =
      remote !== undefined && remote !== null
        ? this.getRemote(remote)
        : (this.config.defaultRemote as EveesRemote);

    const refPerspective = await loadEntity<Signed<Perspective>>(this.client, perspectiveId);
    if (!refPerspective) throw new Error(`base perspective ${perspectiveId} not found`);

    const headId = await EveesHelpers.getPerspectiveHeadId(this.client, perspectiveId);

    const perspective = await eveesRemote.snapPerspective(
      parentId,
      refPerspective.object.payload.context,
      undefined,
      undefined,
      perspectiveId,
      headId
    );

    /* BUG-FIXED: this is needed so that the getOwner of the snapPerspective function has the parent object. 
       TODO: How to add the concept of workspaces to the fork process? how to snapPerspectives based on a workspace ? */
    await EveesHelpers.createEntity(this.client, eveesRemote.store, perspective.object);

    let forkCommitId: string | undefined = undefined;

    if (headId !== undefined) {
      forkCommitId = await this.forkCommit(
        headId,
        workspace,
        eveesRemote.id,
        perspective.id // this perspective is set as the parent of the children's new perspectives
      );
    }

    workspace.newPerspective({
      perspective,
      details: { headId: forkCommitId, name },
      parentId
    });

    return perspective.id;
  }

  public async forkCommit(
    commitId: string,
    workspace: EveesWorkspace,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const commit: Secured<Commit> | undefined = await loadEntity(this.client, commitId);
    if (!commit) throw new Error(`Could not find commit with id ${commitId}`);

    const remoteInstance = this.getRemote(remote);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, workspace, remote, parentId);

    const eveesRemote = this.getRemote(remote);

    /** build new head object pointing to new data */
    const newCommit: Commit = {
      creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
      dataId: dataForkId,
      message: `autocommit to fork ${commitId} on remote ${remote}`,
      forking: commitId,
      parentsIds: [],
      timestamp: Date.now()
    };

    const newHead: Secured<Commit> = await deriveSecured(newCommit, remoteInstance.store.cidConfig);
    newHead.casID = remoteInstance.store.casID;
    workspace.create(newHead);

    return newHead.id;
  }

  public async forkEntity(
    entityId: string,
    workspace: EveesWorkspace,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const data = await loadEntity(this.client, entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const getLinksForks = this.getEntityChildren(data).map(link =>
      this.fork(link, workspace, remote, parentId)
    );
    const newLinks = await Promise.all(getLinksForks);
    const tempData = this.replaceEntityChildren(data, newLinks);

    const remoteInstance = this.eveesRemotes.find(r => r.id === remote);
    if (!remoteInstance)
      throw new Error(`Could not find registered evees remote for remote with ID ${remote}`);

    const newData = await deriveEntity(tempData.object, remoteInstance.store.cidConfig);

    newData.casID = remoteInstance.store.casID;
    workspace.create(newData);

    return newData.id;
  }
}
