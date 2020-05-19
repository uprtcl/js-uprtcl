import { gql } from 'apollo-boost';
import { injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { loadEntity } from '@uprtcl/multiplatform';
import { HasChildren } from '@uprtcl/cortex';

import { SimpleMergeStrategy } from './simple.merge-strategy';
import { EveesWorkspace } from '../services/evees.workspace';

@injectable()
export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext:
    | Dictionary<{
        to: string | undefined;
        from: string | undefined;
      }>
    | undefined = undefined;

  allPerspectives: Dictionary<string> | undefined = undefined;

  async isPattern(id: string, type: string): Promise<boolean> {
    const entity = await loadEntity(this.client, id);
    if (entity === undefined) throw new Error('entity not found');
    const recongnizedType = this.recognizer.recognizeType(entity);
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

  async readPerspective(perspectiveId: string, to: boolean): Promise<void> {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspectiveId}") {
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

            context {
              id
            }
          }
        }
      }`,
    });

    const context = result.data.entity.context.id;

    if (result.data.entity.head == null) {
      throw new Error(`head null reading perspective ${perspectiveId}`);
    }

    const dataObject = result.data.entity.head.data._context.object;
    const dataId = result.data.entity.head.data.id;
    const data = { id: dataId, object: dataObject };

    this.setPerspective(perspectiveId, context, to);

    const hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(data)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (hasChildren) {
      const links = hasChildren.getChildrenLinks(data);

      const promises = links.map(async (link) => {
        const isPerspective = await this.isPattern(link, 'Perspective');
        if (isPerspective) {
          this.readPerspective(link, to);
        } else {
          Promise.resolve();
        }
      });

      await Promise.all(promises);
    }
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
    workspace: EveesWorkspace,
    config: any
  ) {
    /** reset internal state */
    this.perspectivesByContext = undefined;
    this.allPerspectives = undefined;

    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, workspace, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = {};
      this.allPerspectives = {};
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    }

    return super.mergePerspectives(toPerspectiveId, fromPerspectiveId, workspace, config);
  }

  private async getPerspectiveContext(perspectiveId: string): Promise<string> {
    if (!this.allPerspectives) throw new Error('allPerspectives undefined');

    if (this.allPerspectives[perspectiveId]) {
      return this.allPerspectives[perspectiveId];
    } else {
      const result = await this.client.query({
        query: gql`{
          entity(ref: "${perspectiveId}") {
            id
            ... on Perspective {
              context{
                id
              }
            }
          }
        }`,
      });

      const context = result.data.entity.context.id;

      if (!context)
        throw new Error(
          `Cannot merge based on context: context of perspective with id ${perspectiveId} is undefined`
        );

      return context;
    }
  }

  async getLinkMergeId(link: string) {
    const isPerspective = await this.isPattern(link, 'Perspective');
    if (isPerspective) {
      return this.getPerspectiveContext(link);
    } else {
      return Promise.resolve(link);
    }
  }

  async checkPerspectiveAndOwner(perspectiveId: string, authority: string, canWrite: string) {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective { payload { authority} }
          _context { patterns { accessControl { permissions} } }
        }
      }`,
    });

    const thisAuthority = result.data.entity.payload.authority;
    const owner = result.data.entity._context.patterns.accessControl.permissions.owner;

    if (authority !== thisAuthority) {
      return false;
    } else {
      return canWrite === owner;
    }
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    workspace: EveesWorkspace,
    config: any
  ): Promise<string[]> {
    if (!this.perspectivesByContext) throw new Error('perspectivesByContext undefined');

    /** The context is used as Merge ID for perspective to have a context-based merge. For othe
     * type of entities, like commits or data, the link itself is used is mergeId */
    const originalPromises = originalLinks.map((link) => this.getLinkMergeId(link));
    const modificationsPromises = modificationsLinks.map((links) =>
      links.map((link) => this.getLinkMergeId(link))
    );

    const originalMergeIds = await Promise.all(originalPromises);
    const modificationsMergeIds = await Promise.all(
      modificationsPromises.map((promises) => Promise.all(promises))
    );

    const mergedLinks = await super.mergeLinks(
      originalMergeIds,
      modificationsMergeIds,
      workspace,
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
              workspace,
              config
            );

            return perspectivesByContext.to as string;
          } else {
            if (perspectivesByContext.to) {
              /** if the perspective is only present in the "to", just keep it */
              return perspectivesByContext.to;
            } else {
              /** otherwise, if merge config.forceOwner and this perspective is only present in the
               * "from", a fork may be created to make sure the final perspective is in the target authority
               * and canWrite (TODO: canWrite will be replaced by a "copy permissions from element"  or
               * something */

              if (config.forceOwner) {
                const isInternal = await this.checkPerspectiveAndOwner(
                  perspectivesByContext.from as string,
                  config.authority,
                  config.canWrite
                );

                if (!isInternal) {
                  const newPerspectiveId = await this.evees.forkPerspective(
                    perspectivesByContext.from as string,
                    workspace,
                    config.authority,
                    config.canWrite,
                    config.parentId
                  );

                  return newPerspectiveId;
                } else {
                  return perspectivesByContext.from as string;
                }
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
