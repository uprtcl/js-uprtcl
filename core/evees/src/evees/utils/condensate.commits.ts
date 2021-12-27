import { Logger } from '../../utils/logger';
import { createCommit } from '../default.perspectives';
import { IndexDataHelper } from '../index.data.helper';
import { Commit, IndexData, Perspective, Update, Secured } from '../interfaces/index';
import { Signed } from '../../patterns/interfaces/signable';
import { EntityResolver } from '../interfaces/entity.resolver';

export interface CommitDAG {
  commits: Set<Secured<Commit>>;
  heads: string[];
  tails: string[]; // redundant
}

/** Condensation of a DAG of commits into their heads.
 * Processes a set of Update elements (representing a DAG) and returns another set with only one equivalent Update per DAG head.
 * It squashes all intermediate commits, combines their indexing operations, and create new head commits connected to the parents of the
 * tail commits in the DAG */
export class CondensateCommits {
  allCommits: Map<string, Secured<Commit>> = new Map();
  updatesMap: Map<string, Update> = new Map();

  /** reverse map parentIds */
  childrenMap: Map<string, Set<string>> = new Map();

  remoteId!: string;
  perspectiveId!: string;
  logger = new Logger('CondensateCommits');

  constructor(
    protected entityResolver: EntityResolver,
    protected updates: Update[],
    protected squash: boolean = true,
    protected logEnabled = false
  ) {}

  async init() {
    this.perspectiveId = this.updates[0].perspectiveId;

    const perspective = await this.entityResolver.getEntity<Signed<Perspective>>(
      this.perspectiveId
    );
    this.remoteId = perspective.object.payload.remote;

    if (this.logEnabled) this.logger.log('init()', { updates: this.updatesMap, perspective });

    this.updates.forEach((update) => {
      if (this.perspectiveId && this.perspectiveId !== update.perspectiveId) {
        throw new Error('All updates must be of the same perspective');
      }
    });

    await this.readAllCommits();
    this.indexChildren();
  }

  private async readAllCommits() {
    /** extract all head commits in the Updates and create a map from commit id to Update */
    const headIds = this.updates
      .map((update) => {
        if (!update.details.headId) {
          throw new Error('shit, we thought headId would always be defined');
        }
        this.updatesMap.set(update.details.headId, update);
        return update.details.headId;
      })
      .filter((head) => head !== undefined) as string[];

    const commits = await this.entityResolver.getEntities(headIds);
    commits.map((commit) => this.allCommits.set(commit.hash, commit));

    if (this.logEnabled) this.logger.log('readAllCommits()', { allCommits: this.allCommits });
  }

  /** the parents of the commit are both the parentIds and the forking properties */
  private getParents(commit: Secured<Commit>) {
    return commit.object.payload.parentsIds.concat(
      commit.object.payload.forking ? [commit.object.payload.forking] : []
    );
  }

  /** create a map from commit id to its children (all commits in the DAG who has that commit as parent) */
  private indexChildren() {
    Array.from(this.allCommits.values()).map((commit) => {
      /** forking is a special type of parent */
      const parentsIds = this.getParents(commit);

      /** add this commit as child of all its parents */
      parentsIds.forEach((parentId) => {
        const children = this.childrenMap.get(parentId) || new Set();
        children.add(commit.hash);
        this.childrenMap.set(parentId, children);
      });
    });
  }

  /** find all the commits have at least one parent outside of the original DAG */
  private findTails(): string[] {
    const tails: string[] = [];
    Array.from(this.allCommits.values()).filter((commit) => {
      const parentsIds = this.getParents(commit);
      /** find at least one parent that is not in the original DAG */
      const parentIx = parentsIds.findIndex((parentId) => this.allCommits.has(parentId));
      const isTail = parentIx === -1 || parentsIds.length === 0;
      if (isTail) {
        /** tail commit */
        tails.push(commit.hash);
      }
    });

    if (this.logEnabled) this.logger.log('findTails()', { tails });

    return tails;
  }

  /** Navigates commit children until no further children exist, combine updates in the proecss */
  private async condenseUpdate(
    commitId: string,
    onParents: string[],
    forking?: string,
    currentList: string[] = [],
    indexData?: IndexData
  ): Promise<Update[]> {
    const children = this.childrenMap.get(commitId);
    if (this.logEnabled) this.logger.log('condenseUpdate()', { commitId, children });

    if (children && children.size > 0) {
      const childrenHeads = await Promise.all(
        Array.from(children.values()).map(async (childId) => {
          const childUpdate = this.updatesMap.get(childId);
          if (!childUpdate) throw new Error('child Updated not found');

          const newList = [...currentList];
          newList.push(commitId);

          const updates = await this.condenseUpdate(
            childId,
            onParents,
            forking,
            newList,
            indexData
          );
          return updates;
        })
      );

      return Array.prototype.concat.apply([], childrenHeads);
    }

    /** this is a head, so create a new Update object
     * that replaces all the updates in the list */
    const update = this.updatesMap.get(commitId) as Update;
    let newUpdate: Update;

    if (this.squash) {
      /** squash creates a new head commit that squashes (removes) all intermediate commits  */
      const commit = this.allCommits.get(commitId) as Secured<Commit>;
      const newCommitObject = createCommit({
        dataId: commit.object.payload.dataId,
        creatorsIds: commit.object.payload.creatorsIds,
        message: `condensating ${currentList.join(' ')}`,
        parentsIds: onParents,
        forking: forking,
      });

      const head = await this.entityResolver.hashObject({
        object: newCommitObject,
        remote: this.remoteId,
      });

      newUpdate = {
        details: {
          ...update.details,
          headId: head.hash,
        },
        perspectiveId: update.perspectiveId,
        fromPerspectiveId: update.fromPerspectiveId,
        indexData: indexData,
      };
    } else {
      /** if not squash simply return the last update with the compounded indexData  */
      newUpdate = {
        ...update,
        indexData: indexData,
      };
    }

    if (this.logEnabled)
      this.logger.log('condenseUpdate() - newUpdate', {
        newUpdate: newUpdate,
      });

    return [newUpdate];
  }

  async condensate(): Promise<Update[]> {
    if (this.logEnabled)
      this.logger.log('condensate()', { perspectiveId: this.perspectiveId, updates: this.updates });

    if (this.updates.length === 1) {
      if (this.logEnabled) this.logger.log('condenseUpdate() - NOP');
      return this.updates;
    }

    const tailsIds = this.findTails();

    /** for each tail, explore forward to find all connected heads */
    const updates = await Promise.all(
      tailsIds.map((tailId) => {
        const commit = this.allCommits.get(tailId);
        if (!commit) throw new Error('Commit not found');
        return this.condenseUpdate(tailId, commit.object.payload.parentsIds);
      })
    );

    return Array.prototype.concat.apply([], updates);
  }
}
