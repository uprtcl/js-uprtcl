import gql from 'graphql-tag';
import { injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { HasChildren, Hashed } from '@uprtcl/cortex';

import { SimpleMergeStrategy } from './simple.merge-strategy';
import {
  Commit,
  UprtclAction,
  UPDATE_HEAD_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_DATA_ACTION,
  UpdateRequest
} from '../types';

@injectable()
export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext!: Dictionary<{
    to: string | undefined;
    from: string | undefined;
  }>;

  allPerspectives!: Dictionary<string>;

  setPerspective(perspectiveId: string, context: string, to: boolean): void {
    if (!this.perspectivesByContext[context]) {
      this.perspectivesByContext[context] = {
        to: undefined,
        from: undefined
      };
    }

    if (to) {
      this.perspectivesByContext[context].to = perspectiveId;
    } else {
      this.perspectivesByContext[context].from = perspectiveId;
    }

    this.allPerspectives[perspectiveId] = context;
  }

  async readPerspective(perspectiveId: string, to: boolean): Promise<void> {
    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              data {
                id
                _context {
                  raw
                }
              }
            }

            context {
              id
            }
          }
        }
      }`
    });

    const context = result.data.entity.context.id;
    const jsonData = result.data.entity.head.data._context.raw;

    const dataObject = JSON.parse(jsonData);
    const dataId = result.data.entity.head.data.id;
    const data = { id: dataId, object: dataObject };

    this.setPerspective(perspectiveId, context, to);

    const hasChildren: HasChildren | undefined = this.recognizer
      .recognize(data)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (hasChildren) {
      const links = hasChildren.getChildrenLinks(data);

      const promises = links.map(link => this.readPerspective(link, to));
      await Promise.all(promises);
    }
  }

  async readAllSubcontexts(toPerspectiveId: string, fromPerspectiveId: string): Promise<void> {
    const promises = [
      this.readPerspective(toPerspectiveId, true),
      this.readPerspective(fromPerspectiveId, false)
    ];

    await Promise.all(promises);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config?: any
  ): Promise<[string, UprtclAction[]]> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = {};
      this.allPerspectives = {};
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    }

    return super.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  private async getPerspectiveContext(perspectiveId: string): Promise<string> {
    if (this.allPerspectives[perspectiveId]) {
      return this.allPerspectives[perspectiveId];
    } else {
      const result = await this.client.query({
        query: gql`{
          entity(id: "${perspectiveId}") {
            id
            ... on Perspective {
              context{
                id
              }
            }
          }
        }`
      });

      const context = result.data.entity.context.id;

      if (!context)
        throw new Error(
          `Cannot merge based on context: context of perspective with id ${perspectiveId} is undefined`
        );

      return context;
    }
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    config: any
  ): Promise<[string[], UprtclAction[]]> {
    const originalPromises = originalLinks.map(link => this.getPerspectiveContext(link));
    const modificationsPromises = modificationsLinks.map(links =>
      links.map(link => this.getPerspectiveContext(link))
    );

    const originalContexts = await Promise.all(originalPromises);
    const modificationsContexts = await Promise.all(
      modificationsPromises.map(promises => Promise.all(promises))
    );

    const [contextIdLinks, actions] = await super.mergeLinks(
      originalContexts,
      modificationsContexts,
      config
    );

    const dictionary = this.perspectivesByContext;

    const promises: Array<Promise<[string, UprtclAction[]]>> = contextIdLinks.map(
      async contextId => {
        const perspectivesByContext = dictionary[contextId];

        const needsSubperspectiveMerge =
          perspectivesByContext && perspectivesByContext.to && perspectivesByContext.from;

        if (needsSubperspectiveMerge) {
          // We need to merge the new perspectives with the original perspective
          const [_, actions] = await this.mergePerspectives(
            perspectivesByContext.to as string,
            perspectivesByContext.from as string,
            config
          );

          // The final perspective has not changed
          return [perspectivesByContext.to as string, actions] as [string, UprtclAction[]];
        } else {
          const finalPerspectiveId = perspectivesByContext.to
            ? perspectivesByContext.to
            : perspectivesByContext.from;

          /** TODO: why is this needed? its creating abug when merging wiki
           * with one page and one paragraph into a wiki without pages.
           * only one head update is expected, but two are found. The head
           * of the page is updated but it should not.
           */
          const actions = await this.mergePerspectiveChildren(finalPerspectiveId as string, config);

          return [finalPerspectiveId as string, actions] as [string, UprtclAction[]];
        }
      }
    );

    const result = await Promise.all(promises);
    const links = result.map(r => r[0]);
    const subActions = result.map(r => r[1]);

    return [links, actions.concat(...subActions)];
  }

  protected async updatePerspectiveData(
    perspectiveId: string,
    data: any
  ): Promise<Array<UprtclAction>> {
    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
            payload {
              origin
            }
          }
        }
      }`
    });

    const origin = result.data.entity.payload.origin;
    const headId = result.data.entity.head.id;

    const remote = this.evees.getAuthority(origin);

    if (!remote.userId)
      throw new Error('Cannot create perspectives in a remote you are not signed in');

    const patternName = this.recognizer.recognize(data)[0].name;
    const dataSource = this.remotesConfig.map(remote.authority, patternName);

    const newHasheData = await this.hashed.derive()(data, dataSource.hashRecipe);

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity: newHasheData,
      payload: {
        source: dataSource.source
      }
    };

    this.entityCache.cacheEntity(newHasheData);

    const commit: Commit = {
      dataId: newHasheData.id,
      parentsIds: headId ? [headId] : [],
      creatorsIds: [remote.userId],
      message: 'Merge: reference new commits',
      timestamp: Date.now()
    };

    const securedCommit = await this.secured.derive()(commit, remote.hashRecipe);

    const newCommitAction: UprtclAction = {
      type: CREATE_COMMIT_ACTION,
      entity: securedCommit,
      payload: {
        source: remote.source
      }
    };

    this.entityCache.cacheEntity(securedCommit);

    const updateRequest: UpdateRequest = {
      fromPerspectiveId: undefined,
      perspectiveId,
      oldHeadId: headId,
      newHeadId: securedCommit.id
    };

    const updateHead = this.buildUpdateAction(updateRequest);

    return [updateHead, newCommitAction, newDataAction];
  }

  private async mergePerspectiveChildren(
    perspectiveId: string,
    config: any
  ): Promise<UprtclAction[]> {
    const data = await this.loadPerspectiveData(perspectiveId);

    const hasChildren: HasChildren | undefined = this.recognizer
      .recognize(data)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) return [];

    const links = hasChildren.getChildrenLinks(data);

    if (links.length === 0) return [];

    let [mergedLinks, linksActions] = await this.mergeLinks(links, [links], config);

    if (!links.every((link, index) => link !== mergedLinks[index])) {
      /** data is Hased -> new Data should be hashed too */
      const newData = hasChildren.replaceChildrenLinks(data)(mergedLinks) as Hashed<any>;

      const actions = await this.updatePerspectiveData(perspectiveId, newData.object);
      linksActions = linksActions.concat(actions);
    }

    return linksActions;
  }
}
