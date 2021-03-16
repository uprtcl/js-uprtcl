import { filterAsync } from '../../../utils/async';
import { Signed } from '../../../patterns/interfaces/signable';
import { Evees } from '../../../evees/evees.service';

import { SearchEngine } from '../../interfaces/search.engine';
import {
  SearchOptions,
  ParentAndChild,
  Perspective,
  SearchResult,
  SearchForkOptions,
  ForkOf,
} from '../../interfaces/types';

import { EveesCacheDB, PerspectiveLocal } from './cache.local.db';

export class LocalSearchEngine implements SearchEngine {
  /** The evees service is needed to navigate a tree of perspectives stored on other remotes */
  private evees!: Evees;

  constructor(readonly db: EveesCacheDB) {}

  public setEvees(evees: Evees) {
    this.evees = evees;
  }

  explore(options: SearchOptions): Promise<SearchResult> {
    throw new Error('Method not implemented.');
  }

  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
    throw new Error('Method not implemented.');
  }

  async getPerspectiveLocal(perspectiveId): Promise<PerspectiveLocal> {
    const perspectiveLocal = await this.db.perspectives.get(perspectiveId);
    if (!perspectiveLocal) throw Error(`Perpsective ${perspectiveId} not found in local DB`);
    return perspectiveLocal;
  }

  async getContext(perspectiveId: string): Promise<string> {
    const perspective = await this.evees.client.store.getEntity<Signed<Perspective>>(perspectiveId);
    return perspective.object.payload.context;
  }

  /** the independentOfParent will return other perspectives which don't
   * have a parent with the context of the independentPerspective input */
  async otherPerspectives(perspectiveId: string, independentOfParent?: string): Promise<ForkOf[]> {
    const context = await this.getContext(perspectiveId);

    const allOthers = await this.db.perspectives.where('context').equals(context).primaryKeys();

    if (!independentOfParent) {
      return allOthers.map((otherId) => {
        return {
          forkId: otherId,
          ofPerspectiveId: perspectiveId,
        };
      });
    }

    const parentContext = await this.getContext(independentOfParent);

    const independent = await filterAsync<string>(allOthers, async (other) => {
      // get all parents of this other perspective
      const elParentsIds = await this.db.perspectives.where('children').equals(other).primaryKeys();

      const parentSameContext = await filterAsync<string>(elParentsIds, async (elParentId) => {
        const elParentContext = await this.getContext(elParentId);
        return elParentContext === parentContext;
      });

      return parentSameContext.length === 0;
    });

    return independent.map((otherId) => {
      return {
        forkId: otherId,
        ofPerspectiveId: perspectiveId,
      };
    });
  }

  async independentSubPerspectivesRec(
    perspectiveId: string,
    parentId?: string,
    levels: number = -1
  ): Promise<ForkOf[]> {
    const thisLevel = await this.otherPerspectives(perspectiveId, parentId);

    if (levels === 0) {
      return thisLevel;
    }

    /** recurse on children */
    const children = await this.evees.getPerspectiveChildren(perspectiveId);

    const independent = await Promise.all(
      children.map((childId) =>
        this.independentSubPerspectivesRec(childId, perspectiveId, levels - 1)
      )
    );

    return thisLevel.concat(...independent);
  }
  // search independent perspectives
  // const perspectiveInDb = await this.remote.db.perspectives.get(perspectiveId);

  // perspectiveInDb.children.map();

  async forks(
    perspectiveId: string,
    options: SearchForkOptions = { levels: 0 }
  ): Promise<ForkOf[]> {
    return this.independentSubPerspectivesRec(perspectiveId, undefined, options.levels);
  }
}
