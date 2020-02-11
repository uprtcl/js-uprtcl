import { injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { HasChildren, Hashed } from '@uprtcl/cortex';
import { createEntity } from '@uprtcl/multiplatform';

import { Secured } from '../patterns/default-secured.pattern';
import { SimpleMergeStrategy } from './simple.merge-strategy';
import { Perspective, UpdateRequest, Commit, UprtclAction } from '../types';
import { CREATE_COMMIT } from '../graphql/queries';
import gql from 'graphql-tag';

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
  ): Promise<UprtclAction[]> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = {};
      this.allPerspectives = {};
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    }

    await super.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);

    return this.updatesList;
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
  ): Promise<string[]> {
    const originalPromises = originalLinks.map(link => this.getPerspectiveContext(link));
    const modificationsPromises = modificationsLinks.map(links =>
      links.map(link => this.getPerspectiveContext(link))
    );

    const originalContexts = await Promise.all(originalPromises);
    const modificationsContexts = await Promise.all(
      modificationsPromises.map(promises => Promise.all(promises))
    );

    const contextIdLinks = await super.mergeLinks(originalContexts, modificationsContexts, config);

    const dictionary = this.perspectivesByContext;

    const promises = contextIdLinks.map(async contextId => {
      const perspectivesByContext = dictionary[contextId];

      const needsSubperspectiveMerge =
        perspectivesByContext && perspectivesByContext.to && perspectivesByContext.from;

      if (needsSubperspectiveMerge) {
        // We need to merge the new perspectives with the original perspective
        await this.mergePerspectives(
          perspectivesByContext.to as string,
          perspectivesByContext.from as string,
          config
        );

        // The final perspective has not changed
        return perspectivesByContext.to as string;
      } else {
        const finalPerspectiveId = perspectivesByContext.to
          ? perspectivesByContext.to
          : perspectivesByContext.from;

        /** TODO: why is this needed? its creating abug when merging wiki
         * with one page and one paragraph into a wiki without pages.
         * only one head update is expected, but two are found. The head
         * of the page is updated but it should not.
         */
        // await this.mergePerspectiveChildren(finalPerspectiveId as string);

        return finalPerspectiveId as string;
      }
    });

    const links = await Promise.all(promises);

    return links;
  }

  protected async updatePerspectiveData(perspectiveId: string, data: any): Promise<UpdateRequest> {
    const remote = await this.evees.getPerspectiveProviderById(perspectiveId);
    const details = await remote.getPerspectiveDetails(perspectiveId);

    const patternName = this.recognizer.recognize(data)[0].name;
    const newDataId = await createEntity(this.recognizer)(
      data,
      this.remotesConfig.map(remote.authority, patternName).source
    );

    const head = await this.client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: newDataId,
        parentsIds: details.headId ? [details.headId] : [],
        creatorsIds: [remote.userId],
        message: 'Merge: reference new commits',
        source: remote.source,
        timestamp: Date.now()
      }
    });

    return {
      fromPerspectiveId: undefined,
      perspectiveId,
      oldHeadId: details.headId,
      newHeadId: head.data.createCommit.id
    };
  }

  private async mergePerspectiveChildren(perspectiveId: string, config: any): Promise<void> {
    const data = await this.loadPerspectiveData(perspectiveId);

    const hasChildren: HasChildren | undefined = this.recognizer
      .recognize(data)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) return;

    const links = hasChildren.getChildrenLinks(data);

    if (links.length === 0) return;

    const mergedLinks = await this.mergeLinks(links, [links], config);

    if (!links.every((link, index) => link !== mergedLinks[index])) {
      /** data is Hased -> new Data should be hashed too */
      const newData = hasChildren.replaceChildrenLinks(data)(mergedLinks) as Hashed<any>;

      const updateRequest = await this.updatePerspectiveData(perspectiveId, newData.object);
      this.addUpdateRequest(updateRequest);
    }
  }
}
