import { ApolloClient, gql } from 'apollo-boost';
import { multiInject, injectable, inject } from 'inversify';

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
import { ApolloClientModule } from '@uprtcl/graphql';

import { Secured } from '../patterns/default-secured.pattern';
import {
  Perspective,
  Commit,
  RemotesConfig,
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  NodeActions,
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { CidHashedPattern } from '../patterns/cid-hashed.pattern';
import { CREATE_COMMIT } from 'src/uprtcl-evees';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  constructor(
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(EveesBindings.Secured) protected secured: IsSecure<any>,
    @inject(EveesBindings.Hashed) protected hashed: CidHashedPattern,
    @inject(DiscoveryModule.bindings.LocalKnownSources)
    public knownSources: KnownSourcesService,
    @inject(DiscoveryModule.bindings.DiscoveryService)
    protected discovery: DiscoveryService,
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
          entity(id: "${perspectiveId}") {
            id 
            ... on Perspective {
              payload {
                authority
              }
            }
          }
        }
      `
    });

    const perspectiveOrigin = result.data.entity.payload.authority;
    return this.getAuthority(perspectiveOrigin);
  }

  public async isPerspective(id: string): Promise<boolean> {
    const entity = await this.discovery.get(id) as object;
    const pattern = this.recognizer.recognize(entity);
    return pattern.findIndex(p => p.name === "Perspective") !== -1;
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

  async isPattern(id: string, name: string): Promise<boolean> {
    const entity = await this.discovery.get(id) as object;
    const pattern = this.recognizer.recognize(entity);
    return pattern.findIndex(p => p.name === name) !== -1;
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
    authority: string,
    canWrite: string,
    parentId?: string,
    context?: string,
    name?: string
  ): Promise<NodeActions<string>> {

    const isPerspective = await this.isPattern(id, "Perspective");
    if (isPerspective) {
      return this.forkPerspective(id, authority, canWrite);
    } else {
      const isCommit = await this.isPattern(id, "Commit");
      if (isCommit) {
        return this.forkCommit(id, authority, canWrite);
      } else {
        return this.forkEntity(id, authority, canWrite);
      }
    }
  }

  getEntityChildren(entity: object) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognize(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.getChildrenLinks(entity);
    }
  }

  replaceEntityChildren(entity: object, newLinks: string[]) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognize(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      throw new Error(`entity dont hasChildren ${JSON.stringify(entity)}`);
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  public async forkPerspective(
    perspectiveId: string, 
    authority?: string, 
    canWrite?: string,
    name?: string,
    parentId?: string): Promise<NodeActions<string>> {

    const eveesRemote = authority !== undefined ? this.getAuthority(authority) : this.remotesConfig.defaultCreator;
    canWrite = canWrite !== undefined ? canWrite : eveesRemote.userId !== undefined ? eveesRemote.userId : '';

    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
            context {
              id
            }
          }
        }
      }`
    });

    const headId = result.data.entity.head.id;
    const context = result.data.entity.context.id;

    const forkCommit = await this.forkCommit(headId, eveesRemote.authority, canWrite);
    
    const object: Perspective = {
      creatorId: eveesRemote.userId ? eveesRemote.userId : '',
      authority: eveesRemote.authority,
      timestamp: Date.now()
    };

    const perspective: Secured<Perspective> = await this.secured.derive()(
      object,
      eveesRemote.hashRecipe
    );
    
    const newPerspectiveAction: UprtclAction = {
      type: CREATE_AND_INIT_PERSPECTIVE_ACTION,
      entity: perspective,
      payload: {
        details: { headId: forkCommit.new, name, context },
        owner: canWrite,
        parentId
      }
    };

    return {
      new: perspective.id,
      actions: [newPerspectiveAction].concat(forkCommit.actions)
    }
  }

  public async forkCommit(
    commitId: string, 
    authority: string, 
    canWrite: string): Promise<NodeActions<string>> {

    const commit = await this.discovery.get(commitId) as Hashed<Signed<Commit>>;
    const remote = this.getAuthority(authority);

    const dataId = commit.object.payload.dataId;
    const dataFork = await this.forkEntity(dataId, authority, canWrite);

    const eveesRemote = this.getAuthority(authority);

    /** build new head object pointing to new data */
    const newCommit: Signed<Commit> = {
      payload: {
        creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
        dataId: dataFork.new,
        message: `autocommit to fork ${commitId} on authority ${authority}`,
        parentsIds: [commit.id],
        timestamp: Date.now()
      },
      proof: {
        type: '',
        signature: ''
      }
    };

    const newHead = await this.hashed.derive()(newCommit, remote.hashRecipe);

    const newCommitAction: UprtclAction = {
      type: CREATE_COMMIT_ACTION,
      entity: newHead,
      payload: {
        source: remote.source
      }
    };

    return {
      new: newHead.id, 
      actions: [newCommitAction].concat(dataFork.actions)
    }
  }

  public async forkEntity(
    entityId: string, 
    authority: string, 
    canWrite: string): Promise<NodeActions<string>> {

    const data = await this.discovery.get(entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const oldLinks = this.getEntityChildren(data.object);

    const getLinksForks = oldLinks.map(link => this.fork(link, authority, canWrite))

    const newLinksNodeActions = await Promise.all(getLinksForks);
    const newLinks = newLinksNodeActions.map(node => node.new);

    const newObject = this.replaceEntityChildren(data.object, newLinks);

    const source = this.remotesConfig.map(authority);
    const newData = await this.hashed.derive()(newObject, source.hashRecipe);

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity: newData,
      payload: {
        source: source.source
      }
    };

    return {
      new: newData.id,
      actions: [newDataAction].concat(...newLinksNodeActions.map(node => node.actions))
    } 
  }
}
