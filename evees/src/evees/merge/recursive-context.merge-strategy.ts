import { SimpleMergeStrategy } from './simple.merge-strategy';
import { Evees } from '../evees.service';
import { HasChildren } from 'src/patterns/behaviours/has-links';

export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext:
    | Map<
        string,
        {
          to: string | undefined;
          from: string | undefined;
        }
      >
    | undefined = undefined;

  allPerspectives: Map<string, string> | undefined = undefined;

  async isPattern(id: string, type: string, evees: Evees): Promise<boolean> {
    const entity = await evees.client.store.getEntity(id);
    if (entity === undefined) throw new Error('entity not found');
    const recongnizedType = evees.recognizer.recognizeType(entity);
    return type === recongnizedType;
  }

  setPerspective(perspectiveId: string, context: string, to: boolean): void {
    if (!this.perspectivesByContext) throw new Error('perspectivesByContext undefined');
    if (!this.allPerspectives) throw new Error('allPerspectives undefined');

    if (!this.perspectivesByContext[context]) {
      this.perspectivesByContext[context] = {
        to: undefined,
        from: undefined,
      };
    }

    if (to) {
      this.perspectivesByContext[context].to = perspectiveId;
    } else {
      this.perspectivesByContext[context].from = perspectiveId;
    }

    this.allPerspectives[perspectiveId] = context;
  }

  async readPerspective(perspectiveId: string, to: boolean, evees: Evees): Promise<void> {
    const context = await evees.getPerspectiveContext(perspectiveId);
    this.setPerspective(perspectiveId, context, to);

    const { details } = await evees.client.getPerspective(perspectiveId);

    if (details.headId == null) {
      return;
    }

    /** read children recursively */
    const data = await evees.getPerspectiveData(perspectiveId);

    const hasChildren: HasChildren | undefined = evees.recognizer
      .recognizeBehaviours(data)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (hasChildren) {
      const links = hasChildren.getChildrenLinks(data);

      const promises = links.map(async (link) => {
        const isPerspective = await this.isPattern(link, 'Perspective', evees);
        if (isPerspective) {
          this.readPerspective(link, to, evees);
        } else {
          Promise.resolve();
        }
      });

      await Promise.all(promises);
    }
  }

  async readAllSubcontexts(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees
  ): Promise<void> {
    const promises = [
      this.readPerspective(toPerspectiveId, true, evees),
      this.readPerspective(fromPerspectiveId, false, evees),
    ];

    await Promise.all(promises);
  }

  async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ) {
    /** reset internal state */
    this.perspectivesByContext = undefined;
    this.allPerspectives = undefined;

    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, evees, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ): Promise<string> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = new Map();
      this.allPerspectives = new Map();
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId, evees);
    }

    return SimpleMergeStrategy.mergePerspectives(toPerspectiveId, fromPerspectiveId, evees, config);
  }

  private async getPerspectiveContext(perspectiveId: string, evees: Evees): Promise<string> {
    if (!this.allPerspectives) throw new Error('allPerspectives undefined');

    if (this.allPerspectives[perspectiveId]) {
      return this.allPerspectives[perspectiveId];
    } else {
      const secured = await evees.client.store.getEntity(perspectiveId);
      if (!secured) throw new Error(`perspective ${perspectiveId} not found`);
      return secured.object.payload.context;
    }
  }

  async getLinkMergeId(link: string, evees: Evees) {
    const isPerspective = await this.isPattern(link, 'Perspective', evees);
    if (isPerspective) {
      return this.getPerspectiveContext(link, evees);
    } else {
      return Promise.resolve(link);
    }
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    evees: Evees,
    config: any
  ): Promise<string[]> {
    if (!this.perspectivesByContext) throw new Error('perspectivesByContext undefined');

    /** The context is used as Merge ID for perspective to have a context-based merge. For other
     * type of entities, like commits or data, the link itself is used as mergeId */
    const originalPromises = originalLinks.map((link) => this.getLinkMergeId(link, evees));
    const modificationsPromises = modificationsLinks.map((links) =>
      links.map((link) => this.getLinkMergeId(link, evees))
    );

    const originalMergeIds = await Promise.all(originalPromises);
    const modificationsMergeIds = await Promise.all(
      modificationsPromises.map((promises) => Promise.all(promises))
    );

    const mergedLinks = await SimpleMergeStrategy.mergeLinks(
      originalMergeIds,
      modificationsMergeIds,
      evees,
      config
    );

    const dictionary = this.perspectivesByContext;

    const mergeLinks = mergedLinks.map(
      async (link): Promise<string> => {
        const perspectivesByContext = dictionary[link];

        if (perspectivesByContext) {
          const needsSubperspectiveMerge = perspectivesByContext.to && perspectivesByContext.from;

          if (needsSubperspectiveMerge) {
            /** Two perspectives of the same context are merged, keeping the "to" perspecive id,
             *  and updating its head (here is where recursion start) */

            config = {
              parentId: perspectivesByContext.to,
              ...config,
            };

            await this.mergePerspectives(
              perspectivesByContext.to as string,
              perspectivesByContext.from as string,
              evees,
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
                const newPerspectiveId = await evees.forkPerspective(
                  perspectivesByContext.from as string,
                  config.remote,
                  config.parentId,
                  evees.client
                );
                return newPerspectiveId;
              } else {
                return perspectivesByContext.from as string;
              }
            }
          }
        } else {
          return link;
        }
      }
    );

    const mergeResults = await Promise.all(mergeLinks);

    return mergeResults;
  }
}
