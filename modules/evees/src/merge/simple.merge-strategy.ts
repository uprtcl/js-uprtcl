import { inject, injectable } from 'inversify';

import {
  DiscoveryModule,
  EntityCache,
  loadEntity,
} from '@uprtcl/multiplatform';
import { Dictionary } from '@uprtcl/micro-orchestrator';
import {
  CortexModule,
  PatternRecognizer,
  Entity,
  Signed,
} from '@uprtcl/cortex';

import { UpdateRequest, Commit } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import findMostRecentCommonAncestor from './common-ancestor';
import { Merge } from '../behaviours/merge';
import { mergeResult } from './utils';
import { deriveEntity } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';
import { EveesWorkspace } from '../services/evees.workspace';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  constructor(
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer)
    protected recognizer: PatternRecognizer,
    @inject(EveesClientModule.bindings.Client)
    protected client: EveesClient,
    @inject(DiscoveryModule.bindings.EntityCache)
    protected entityCache: EntityCache
  ) {}

  mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    return this.mergePerspectives(
      toPerspectiveId,
      fromPerspectiveId,
      config,
      workspace
    );
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(async (id) =>
      EveesHelpers.getPerspectiveHeadId(this.client, id)
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const remote = await this.evees.getPerspectiveRemoteById(toPerspectiveId);

    let newHead: string | undefined;

    newHead = fromHeadId
      ? await this.mergeCommits(
          toHeadId,
          fromHeadId,
          remote.id,
          workspace,
          config
        )
      : toHeadId;

    /** prevent an update head to the same head */
    if (newHead === toHeadId) {
      return toPerspectiveId;
    }

    if (newHead === undefined) {
      throw new Error('New head is undefined');
    }

    const request: UpdateRequest = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: newHead,
    };

    workspace.update(request);
    return toPerspectiveId;
  }

  protected async loadPerspectiveData(
    perspectiveId: string
  ): Promise<Entity<any>> {
    const result = await this.client.query({
      query: gql`{
        entity(uref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              data {
                id 
                _context {
                  object
                }
              }
            }
          }
        }
      }`,
    });

    const object = result.data.entity.head.data._context.object;
    return {
      id: result.data.entity.head.data.id,
      object,
    };
  }

  protected async loadCommitData(
    commitId: string | undefined
  ): Promise<Entity<any> | undefined> {
    if (commitId === undefined) return undefined;

    const result = await this.client.query({
      query: gql`{
        entity(uref: "${commitId}") {
          id
          data {
            id
            _context {
              object
            }
          }
        }
      }`,
    });

    if (!result.data.entity.data) return undefined;

    const object = result.data.entity.data._context.object;
    return {
      id: result.data.entity.data.id,
      object,
    };
  }

  async findLatestNonFork(commitId: string) {
    const commit = await loadEntity<Signed<Commit>>(this.client, commitId);
    if (commit === undefined) throw new Error('commit not found');

    if (commit.object.payload.forking !== undefined) {
      return this.findLatestNonFork(commit.object.payload.forking);
    } else {
      return commitId;
    }
  }

  async mergeCommits(
    toCommitIdOrg: string | undefined,
    fromCommitIdOrg: string,
    remote: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    const toCommitId = toCommitIdOrg
      ? await this.findLatestNonFork(toCommitIdOrg)
      : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg);

    const commitsIds = [toCommitId, fromCommitId];
    const ancestorId = toCommitId
      ? await findMostRecentCommonAncestor(this.client)(commitsIds)
      : fromCommitId;

    const datasPromises = commitsIds.map(async (commitId) =>
      this.loadCommitData(commitId)
    );
    const newDatas = await Promise.all(datasPromises);

    const ancestorData: any =
      ancestorId !== undefined
        ? await this.loadCommitData(ancestorId)
        : newDatas[0];

    const mergedData = await this.mergeData(
      ancestorData,
      newDatas,
      workspace,
      config
    );

    const instance = this.evees.getRemote(remote);
    const sourceRemote = instance.store;

    const entity = await deriveEntity(mergedData, sourceRemote.cidConfig);
    entity.casID = sourceRemote.casID;

    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && entity.id === newDatas[0].id) ||
        toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    workspace.create(entity);

    if (!instance.userId)
      throw new Error('Cannot create commits in a casID you are not signed in');

    /** some commits might be undefined */
    const parentsIds = commitsIds.filter((commit) => !!commit);

    const newCommit: Commit = {
      dataId: entity.id,
      parentsIds: parentsIds,
      message: `Merging commits ${parentsIds.toString()}`,
      timestamp: Date.now(),
      creatorsIds: [instance.userId],
    };

    const securedCommit = await deriveSecured(
      newCommit,
      instance.store.cidConfig
    );

    securedCommit.casID = instance.store.casID;
    workspace.create(securedCommit);

    return securedCommit.id;
  }

  async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    workspace: EveesWorkspace,
    config: any
  ): Promise<T> {
    const merge: Merge | undefined = this.recognizer
      .recognizeBehaviours(originalData)
      .find((prop) => !!(prop as Merge).merge);

    if (!merge)
      throw new Error(
        `Cannot merge data ${JSON.stringify(
          originalData
        )} that does not implement the Mergeable behaviour`
      );

    return merge.merge(originalData)(newDatas, this, workspace, config);
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    workspace: EveesWorkspace,
    config: any
  ): Promise<string[]> {
    const allLinks: Dictionary<boolean> = {};

    const originalLinksDic = {};
    for (let i = 0; i < originalLinks.length; i++) {
      const link = originalLinks[i];
      originalLinksDic[link] = {
        index: i,
        link: link,
      };
    }

    const newLinks: Array<Dictionary<{ index: number; link: string }>> = [];
    for (let i = 0; i < modificationsLinks.length; i++) {
      const newData = modificationsLinks[i];
      const links: Dictionary<{ index: number; link: string }> = {};
      for (let j = 0; j < newData.length; j++) {
        const link = newData[j];
        links[link] = {
          index: j,
          link: link,
        };
        allLinks[link] = true;
      }
      newLinks.push(links);
    }

    const resultLinks: any[] = [];
    for (const link of Object.keys(allLinks)) {
      const linkResult = mergeResult(
        originalLinksDic[link],
        newLinks.map((newLink) => newLink[link])
      );
      if (linkResult) {
        resultLinks.push(linkResult);
      }
    }

    const sortedLinks = resultLinks
      .sort((link1, link2) => link1.index - link2.index)
      .map((link) => link.link);

    return sortedLinks;
  }
}
