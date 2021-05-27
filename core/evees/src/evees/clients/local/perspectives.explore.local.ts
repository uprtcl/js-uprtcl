import { filterAsync } from '../../../utils/async';
import { Signed } from '../../../patterns';
import { Evees } from '../../evees.service';
import {
  SearchOptions,
  Perspective,
  SearchResult,
  ForkOf,
  GetPerspectiveOptions,
  ClientExplore,
} from '../../interfaces';

import { PerspectiveLocal, PerspectivesStoreDB } from './perspectives.store.db';

export class LocalExplore implements ClientExplore {
  /** The evees service is needed to navigate a tree of perspectives stored on other remotes */
  private evees!: Evees;

  constructor(readonly db: PerspectivesStoreDB) {}

  public setEvees(evees: Evees) {
    this.evees = evees;
  }

  async explore(
    options: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult> {
    // TODO: search forks for web3 gov

    const underId = options.start ? options.start.elements[0].id : '';
    if (!underId) {
      throw new Error(`UnderId not defined`);
    }
    const perspectiveIds = await this.db.perspectivesDetails
      .where('onEcosystem')
      .equals(underId)
      .primaryKeys();
    return { perspectiveIds };
  }

  async getPerspectiveLocal(perspectiveId): Promise<PerspectiveLocal> {
    const perspectiveLocal = await this.db.perspectivesDetails.get(perspectiveId);
    if (!perspectiveLocal) throw Error(`Perpsective ${perspectiveId} not found in local DB`);
    return perspectiveLocal;
  }

  async getContext(perspectiveId: string): Promise<string> {
    const perspective = await this.evees.getEntity<Signed<Perspective>>(perspectiveId);
    return perspective.object.payload.context;
  }

  /** the independentOfParent will return other perspectives which don't
   * have a parent with the context of the independentPerspective input */
  async otherPerspectives(perspectiveId: string, independentOfParent?: string): Promise<ForkOf[]> {
    const context = await this.getContext(perspectiveId);

    const allOthers = await this.db.perspectivesDetails
      .where('context')
      .equals(context)
      .primaryKeys();

    if (!independentOfParent) {
      return allOthers.map((otherId) => {
        return {
          forkIds: [otherId],
          ofPerspectiveId: perspectiveId,
        };
      });
    }

    const parentContext = await this.getContext(independentOfParent);

    const independent = await filterAsync<string>(allOthers, async (other) => {
      // get all parents of this other perspective
      const elParentsIds = await this.db.perspectivesDetails
        .where('children')
        .equals(other)
        .primaryKeys();

      const parentSameContext = await filterAsync<string>(elParentsIds, async (elParentId) => {
        const elParentContext = await this.getContext(elParentId);
        return elParentContext === parentContext;
      });

      return parentSameContext.length === 0;
    });

    return independent.map((otherId) => {
      return {
        forkIds: [otherId],
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
}
