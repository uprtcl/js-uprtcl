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
  PerspectiveDetails,
  RemotesConfig,
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  NodeActions
} from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from './evees.remote';
import { CidHashedPattern } from '../patterns/cid-hashed.pattern';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type CreatePerspectiveArgs = {
  parentId?: string;
  ofPerspectiveId?: string;
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
  ): Promise<NodeActions> {

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
      return [];
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  public async forkPerspective(
    perspectiveId: string, 
    authority: string, 
    canWrite: string,
    context?: string,
    name?: string,
    parentId?: string): Promise<NodeActions> {
      
    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`
    });

    const headId = result.data.entity.head.id;

    const forkCommit = await this.forkCommit(headId, authority, canWrite);
    const eveesRemote = this.getAuthority(authority);

    const object: Perspective = {
      creatorId: eveesRemote.userId ? eveesRemote.userId : '',
      origin: eveesRemote.authority,
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
        details: { headId: forkCommit.id, name, context },
        owner: canWrite,
        parentId
      }
    };

    return {
      id: perspective.id,
      actions: [newPerspectiveAction].concat(forkCommit.actions)
    }
  }

  public async forkCommit(
    commitId: string, 
    authority: string, 
    canWrite: string): Promise<NodeActions> {

    const commit = this.discovery.get(commitId) as unknown as Hashed<Signed<Commit>>;
    const remote = this.getAuthority(authority);

    const dataId = commit.object.payload.dataId;
    const dataFork = await this.forkEntity(dataId, authority, canWrite);

    const eveesRemote = this.getAuthority(authority);

    /** build new head object pointing to new data */
    const newCommit: Signed<Commit> = {
      payload: {
        creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
        dataId: dataFork.id,
        message: `autocommit to fork ${commitId}`,
        parentsIds: commit.object.payload.parentsIds,
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
      id: newHead.id, 
      actions: [newCommitAction].concat(dataFork.actions)
    }
  }

  public async forkEntity(
    entityId: string, 
    authority: string, 
    canWrite: string): Promise<NodeActions> {

    const data = await this.discovery.get(entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const oldLinks = this.getEntityChildren(data);

    const getLinksForks = oldLinks.map(link => this.fork(link, authority, canWrite))
    
    const newLinksNodeActions = await Promise.all(getLinksForks);
    const newLinks = newLinksNodeActions.map(node => node.id);

    const newObject = this.replaceEntityChildren(data, newLinks);

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
      id: newData.id,
      actions: [newDataAction].concat(...newLinksNodeActions.map(node => node.actions))
    } 
  }
}
