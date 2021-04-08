import { update } from 'lodash';
import { CASStore } from '../cas/interfaces/cas-store';
import { Secured } from '../cas/utils/cid-hash';
import { createCommit } from './default.perspectives';
import { IndexDataHelper } from './index.data.helper';

import { Client } from './interfaces/client';
import { Commit, IndexData, Update } from './interfaces/types';

export class FindAncestor {
  done = false;

  constructor(protected client: Client, protected lookingFor: string, protected stopAt?: string) {}

  async checkIfParent(commitId: string) {
    /* stop searching all paths once one path finds it */
    if (this.done) {
      return false;
    }

    if (this.lookingFor === commitId) {
      this.done = true;
      return true;
    }

    if (this.stopAt !== undefined) {
      if (this.stopAt === commitId) {
        this.done = true;
        return false;
      }
    }

    const commit = await this.client.store.getEntity(commitId);

    if (commit.object.payload.parentsIds.length === 0) {
      return false;
    }

    const seeParents = await Promise.all(
      commit.object.payload.parentsIds.map((parentId) => {
        /* recursively look on parents */
        return this.checkIfParent(parentId);
      })
    );

    return seeParents.includes(true);
  }
}

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

  constructor(protected store: CASStore, protected updates: Update[]) {}

  async readAllCommits() {
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

    const commits = await this.store.getEntities(headIds);
    commits.entities.map((commit) => this.allCommits.set(commit.id, commit));
  }

  /** the parents of the commit are both the parentIds and the forking properties */
  getParents(commit: Secured<Commit>) {
    return commit.object.payload.parentsIds.concat(
      commit.object.payload.forking ? [commit.object.payload.forking] : []
    );
  }

  /** create a map from commit id to its children (all commits in the DAG who has that commit as parent) */
  indexChildren() {
    Array.from(this.allCommits.values()).map((commit) => {
      /** forking is a special type of parent */
      const parentsIds = this.getParents(commit);

      /** add this commit as child of all its parents */
      parentsIds.forEach((parentId) => {
        const children = this.childrenMap.get(parentId) || new Set();
        children.add(commit.id);
        this.childrenMap.set(parentId, children);
      });
    });
  }

  /** find all the commits have at least one parent outside of the original DAG */
  findTails(): string[] {
    const tails: string[] = [];
    Array.from(this.allCommits.values()).filter((commit) => {
      const parentsIds = this.getParents(commit);
      /** find at least one parent that is not in the original DAG */
      const notIn = parentsIds.findIndex((parentId) => !this.allCommits.has(parentId));
      if (notIn === -1) {
        /** internal commit */
      } else {
        /** tail commit */
        tails.push(commit.id);
      }
    });

    return tails;
  }

  /** Navigates commit children until no further children exist, combine updates in the proecss */
  async condenseUpdate(
    commitId: string,
    onParents: string[],
    forking?: string,
    currentList: string[] = [],
    indexData?: IndexData
  ): Promise<Update[]> {
    const children = this.childrenMap.get(commitId);
    if (children && children.size > 0) {
      const childrenHeads = Array.from(children.values()).map((childId) => {
        const childUpdate = this.updatesMap.get(childId);

        if (!childUpdate) throw new Error('child Updated not found');

        const combinedIndexData = IndexDataHelper.combine(indexData, childUpdate.indexData);

        const newList = [...currentList];
        newList.push(commitId);

        return this.condenseUpdate(childId, onParents, forking, newList, combinedIndexData);
      });

      return Array.prototype.concat.apply([], childrenHeads);
    }

    /** this is a head, so create a new Update object
     * that replaces all the updates in the list */
    const update = this.updatesMap.get(commitId) as Update;
    const commit = this.allCommits.get(commitId) as Secured<Commit>;
    const newCommitObject = createCommit({
      dataId: commit.object.payload.dataId,
      creatorsIds: commit.object.payload.creatorsIds,
      message: `squashing ${JSON.stringify(currentList)}`,
      parentsIds: onParents,
      forking: forking,
    });

    const head = await this.store.storeEntity({
      object: newCommitObject,
      remote: 'WIP',
    });

    const newUpdate: Update = {
      details: {
        ...update.details,
        headId: head.id,
      },
      perspectiveId: update.perspectiveId,
      fromPerspectiveId: update.fromPerspectiveId,
      indexData: indexData,
    };

    return [newUpdate];
  }

  async sort(): Promise<void> {
    const tailsIds = this.findTails();

    /** for each tail, explore forward to find all connected heads */
    const updates = tailsIds.map((tailId) => {
      const commit = this.allCommits.get(tailId);
      if (!commit) throw new Error('Commit not found');
      return this.condenseUpdate(tailId, commit.object.payload.parentsIds);
    });
  }
}
