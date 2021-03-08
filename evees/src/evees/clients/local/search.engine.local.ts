import { filterAsync, mapAsync } from '../../../utils/async';
import { Signed } from '../../../patterns/interfaces/signable';
import { SearchEngine } from '../../interfaces/search.engine';
import {
  SearchOptions,
  ParentAndChild,
  Perspective,
  SearchResult,
  SearchForkOptions,
} from '../../interfaces/types';
import { RemoteEveesLocal } from './remote.local';
import { PerspectiveLocal } from './remote.local.db';

export class LocalSearchEngine implements SearchEngine {
  constructor(protected remote: RemoteEveesLocal) {}

  explore(options: SearchOptions): Promise<SearchResult> {
    throw new Error('Method not implemented.');
  }

  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
    throw new Error('Method not implemented.');
  }

  async getPerspectiveLocal(perspectiveId): Promise<PerspectiveLocal> {
    const perspectiveLocal = await this.remote.db.perspectives.get(perspectiveId);
    if (!perspectiveLocal) throw Error(`Perpsective ${perspectiveId} not found in local DB`);
    return perspectiveLocal;
  }

  async getContext(perspectiveId: string): Promise<string> {
    const perspective = await this.remote.store.getEntity<Signed<Perspective>>(perspectiveId);
    return perspective.object.payload.context;
  }

  /** the independentOfParent will return other perspectives which don't
   * have a parent with the context of the independentPerspective input */
  async otherPerspectives(perspectiveId: string, independentOfParent?: string): Promise<string[]> {
    const context = await this.getContext(perspectiveId);

    const allOthers = await this.remote.db.perspectives
      .where('context')
      .equals(context)
      .primaryKeys();

    if (!independentOfParent) {
      return allOthers;
    }

    const parentContext = await this.getContext(independentOfParent);

    const independent = await filterAsync(allOthers, async (other) => {
      // get all parents of this other perspective
      const elParentsIds = await this.remote.db.perspectives
        .where('children')
        .equals(other)
        .primaryKeys();

      const parentSameContext = await filterAsync(elParentsIds, async (elParentId) => {
        const elParentContext = await this.getContext(elParentId);
        return elParentContext === parentContext;
      });

      return parentSameContext === 0;
    });

    return independent;
  }

  async independentSubPerspectivesRec(
    perspectiveId: string,
    parentId?: string,
    levels: number = -1
  ): Promise<string[]> {
    const thisLevel = await this.otherPerspectives(perspectiveId, parentId);

    if (levels === 0) {
      return thisLevel;
    }

    /** recurse on children */
    const perspectiveLocal = await this.getPerspectiveLocal(perspectiveId);
    const children = perspectiveLocal.children ? perspectiveLocal.children : [];

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
  ): Promise<string[]> {
    return this.independentSubPerspectivesRec(perspectiveId, undefined, options.levels);
  }
}
