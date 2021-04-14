import { PerspectiveType } from '../patterns/perspective.pattern';
import { MergeConfig } from './merge-strategy';
import { SimpleMergeStrategy } from './simple.merge-strategy';
import { mergeArrays } from './utils';

export interface FromTo {
  to?: string;
  from?: string;
}
export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext: Map<string, FromTo> = new Map();

  async isPattern(id: string, type: string): Promise<boolean> {
    const entity = await this.evees.client.store.getEntity(id);
    if (entity === undefined) throw new Error('entity not found');
    const recongnizedType = this.evees.recognizer.recognizeType(entity.object);
    return type === recongnizedType;
  }

  setPerspective(perspectiveId: string, context: string, to: boolean): void {
    if (!this.perspectivesByContext) throw new Error('perspectivesByContext undefined');

    const currentFromTo = this.perspectivesByContext.get(context) as FromTo;
    const newFromTo: FromTo = currentFromTo || {};

    if (to) {
      newFromTo.to = perspectiveId;
    } else {
      newFromTo.from = perspectiveId;
    }

    this.perspectivesByContext.set(context, newFromTo);
  }

  async readPerspective(perspectiveId: string, to: boolean): Promise<void> {
    const context = await this.evees.getPerspectiveContext(perspectiveId);
    this.setPerspective(perspectiveId, context, to);

    const { details } = await this.evees.client.getPerspective(perspectiveId);

    if (details.headId == null) {
      return;
    }

    /** read children recursively */
    const data = await this.evees.getPerspectiveData(perspectiveId);
    const children = this.evees.behaviorConcat(data.object, 'children');

    const promises = children.map(async (child) => {
      const isPerspective = await this.isPattern(child, PerspectiveType);
      if (isPerspective) {
        this.readPerspective(child, to);
      } else {
        Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  async readAllSubcontexts(toPerspectiveId: string, fromPerspectiveId: string): Promise<void> {
    const promises = [
      this.readPerspective(toPerspectiveId, true),
      this.readPerspective(fromPerspectiveId, false),
    ];

    await Promise.all(promises);
  }

  async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ) {
    /** reset internal state */
    this.perspectivesByContext = new Map();
    /** by default use the toPerspectiveId as guardian */
    config.guardianId = config.guardianId || toPerspectiveId;

    await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string> {
    return super.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  async getLinkMergeId(link: string) {
    const isPerspective = await this.isPattern(link, PerspectiveType);
    if (isPerspective) {
      return this.evees.getPerspectiveContext(link);
    } else {
      return Promise.resolve(link);
    }
  }

  async mergeChildren(
    originalLinks: string[],
    modificationsLinks: string[][],
    config: MergeConfig
  ): Promise<string[]> {
    if (!this.perspectivesByContext) throw new Error('perspectivesByContext undefined');

    /** The context is used as Merge ID for perspective to have a context-based merge. For other
     * type of entities, like commits or data, the link itself is used as mergeId */
    const originalPromises = originalLinks.map((link) => this.getLinkMergeId(link));
    const modificationsPromises = modificationsLinks.map((links) =>
      links.map((link) => this.getLinkMergeId(link))
    );

    const originalMergeIds = await Promise.all(originalPromises);
    const modificationsMergeIds = await Promise.all(
      modificationsPromises.map((promises) => Promise.all(promises))
    );

    const mergedLinks = mergeArrays(originalMergeIds, modificationsMergeIds);

    const dictionary = this.perspectivesByContext;

    const mergeLinks = mergedLinks.map(
      async (context): Promise<string> => {
        const perspectivesByContext = dictionary.get(context);
        if (!perspectivesByContext)
          throw new Error(`perspectivesByContext not found for ${context}`);

        const recurse = config.recurse === undefined ? true : config.recurse;

        const needsSubperspectiveMerge =
          perspectivesByContext.to !== undefined && perspectivesByContext.from !== undefined;

        if (recurse && needsSubperspectiveMerge) {
          /** Two perspectives of the same context are merged, keeping the "to" perspecive id,
           *  and updating its head (here is where recursion start) */

          config = {
            guardianId: perspectivesByContext.to,
            ...config,
          };

          await this.mergePerspectives(
            perspectivesByContext.to as string,
            perspectivesByContext.from as string,
            config
          );

          return perspectivesByContext.to as string;
        } else {
          if (perspectivesByContext.to) {
            /** if the perspective is only present in the "to", just keep it */
            return perspectivesByContext.to;
          } else {
            /** otherwise, if merge config.forceOwner and this perspective is only present in the
             * "from", a fork will be created using parentId as the source for permissions*/
            if (config.forceOwner) {
              const newPerspectiveId = await this.evees.forkPerspective(
                perspectivesByContext.from as string,
                config.remote,
                config.guardianId,
                { recurse: true, detach: config.detach !== undefined ? config.detach : false }
              );
              return newPerspectiveId;
            } else {
              return perspectivesByContext.from as string;
            }
          }
        }
      }
    );

    const mergeResults = await Promise.all(mergeLinks);

    return mergeResults;
  }
}
