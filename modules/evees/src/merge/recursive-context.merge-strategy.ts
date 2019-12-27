import { injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { Pattern, HasChildren, Hashed } from '@uprtcl/cortex';
import { Secured, createEntity } from '@uprtcl/common';

import { SimpleMergeStrategy } from './simple.merge-strategy';
import { Perspective, UpdateRequest, Commit } from '../types';

@injectable()
export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext!: Dictionary<{
    to: string | undefined;
    from: string | undefined;
  }>;

  allPerspectives!: Dictionary<string>;

  setPerspective(perspective: Secured<Perspective>, context: string, to: boolean): void {
    if (!this.perspectivesByContext[context]) {
      this.perspectivesByContext[context] = {
        to: undefined,
        from: undefined
      };
    }

    if (to) {
      this.perspectivesByContext[context].to = perspective.id;
    } else {
      this.perspectivesByContext[context].from = perspective.id;
    }

    this.allPerspectives[perspective.id] = context;
  }

  async readPerspective(perspectiveId: string, to: boolean): Promise<void> {
    const perspective: Secured<Perspective> | undefined = await this.evees.get(perspectiveId);

    if (!perspective)
      throw new Error(`Error when trying to fetch perspective with id ${perspectiveId}`);

    const details = await this.evees.getPerspectiveDetails(perspectiveId);

    if (!details.context)
      throw new Error(
        `Perspective with id ${perspectiveId} has no context associated: cannot merge based on the context`
      );

    if (!details.headId)
      throw new Error(`Perspective with id ${perspectiveId} has no head associated: cannot merge`);

    this.setPerspective(perspective, details.context, to);

    const head: Secured<Commit> | undefined = await this.evees.get(details.headId);

    if (!head) throw new Error(`Error when trying to fetch the commit with id ${details.headId}`);

    const data = await this.discovery.get(head.object.payload.dataId);
    if (!data)
      throw new Error(`Error when trying to fetch the data with id ${head.object.payload.dataId}`);

    const hasChildren: HasChildren | undefined = this.recognizer.recognizeUniqueProperty(
      data,
      prop => !!(prop as HasChildren).getChildrenLinks
    );

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
    fromPerspectiveId: string
  ): Promise<UpdateRequest[]> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = {};
      this.allPerspectives = {};
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    }

    await super.mergePerspectives(toPerspectiveId, fromPerspectiveId);

    return this.updatesList;
  }

  private async getPerspectiveContext(perspectiveId: string): Promise<string> {
    if (this.allPerspectives[perspectiveId]) {
      return this.allPerspectives[perspectiveId];
    } else {
      const details = await this.evees.getPerspectiveDetails(perspectiveId);

      if (!details.context)
        throw new Error(
          `Cannot merge based on context: context of perspective with id ${perspectiveId} is undefined`
        );

      return details.context;
    }
  }

  async mergeLinks(originalLinks: string[], modificationsLinks: string[][]): Promise<string[]> {
    const originalPromises = originalLinks.map(link => this.getPerspectiveContext(link));
    const modificationsPromises = modificationsLinks.map(links =>
      links.map(link => this.getPerspectiveContext(link))
    );

    const originalContexts = await Promise.all(originalPromises);
    const modificationsContexts = await Promise.all(
      modificationsPromises.map(promises => Promise.all(promises))
    );

    const contextIdLinks = await super.mergeLinks(originalContexts, modificationsContexts);

    const dictionary = this.perspectivesByContext;

    const promises = contextIdLinks.map(async contextId => {
      const perspectivesByContext = dictionary[contextId];

      const needsSubperspectiveMerge =
        perspectivesByContext && perspectivesByContext.to && perspectivesByContext.from;

      if (needsSubperspectiveMerge) {
        // We need to merge the new perspectives with the original perspective
        await this.mergePerspectives(
          perspectivesByContext.to as string,
          perspectivesByContext.from as string
        );

        // The final perspective has not changed
        return perspectivesByContext.to as string;
      } else {
        const finalPerspectiveId = perspectivesByContext.to
          ? perspectivesByContext.to
          : perspectivesByContext.from;

        await this.mergePerspectiveChildren(finalPerspectiveId as string);

        return finalPerspectiveId as string;
      }
    });

    const links = await Promise.all(promises);

    return links;
  }

  protected async updatePerspectiveData(perspectiveId: string, data: Hashed<any>): Promise<void> {
    const details = await this.evees.getPerspectiveDetails(perspectiveId);

    const newData = await createEntity(this.recognizer)(data);

    const head = await this.evees.createCommit({
      dataId: newData.id,
      parentsIds: details.headId ? [details.headId] : [],
      message: 'Merge: reference new commits'
    });

    this.addUpdateRequest({
      fromPerspectiveId: undefined,
      perspectiveId,
      oldHeadId: details.headId,
      newHeadId: head.id
    });
  }

  private async mergePerspectiveChildren(perspectiveId: string): Promise<void> {
    const data = await this.loadPerspectiveData(perspectiveId);

    const hasChildren: HasChildren | undefined = this.recognizer.recognizeUniqueProperty(
      data,
      prop => !!(prop as HasChildren).getChildrenLinks
    );

    if (!hasChildren) return;

    const links = hasChildren.getChildrenLinks(data);

    const mergedLinks = await this.mergeLinks(links, [links]);

    if (!links.every((link, index) => link !== mergedLinks[index])) {
      const newData = hasChildren.replaceChildrenLinks(data)(mergedLinks);

      await this.updatePerspectiveData(perspectiveId, newData);
    }
  }
}
