import { injectable } from 'inversify';

import { EntryResult, HolochainProvider } from '@uprtcl/holochain-provider';
import { Signed, Hashed } from '@uprtcl/cortex';
import { KnownSourcesService } from '@uprtcl/multiplatform';

import { Secured } from '../../../patterns/default-secured.pattern';
import { Perspective, Commit, PerspectiveDetails } from '../../../types';
import { EveesRemote } from '../../evees.remote';
import { NewPerspectiveData } from 'src/services/evees.provider';

@injectable()
export abstract class EveesHolochain extends HolochainProvider implements EveesRemote {
  
  knownSources?: KnownSourcesService | undefined;
  userId?: string | undefined;
  zome: string = 'evees';

  get authority() {
    return '';
  }

  get accessControl() {
    return undefined;
  }

  get proposals() {
    return undefined;
  }

  get source() {
    // TODO RETURN SOURCE ID
    return 'undefined';
  }

  get hashRecipe() {
    return {};
  }

  /**
   * @override
   */
  public async ready() {
    await super.ready();
  }

  public async get(id: string): Promise<Hashed<any> | undefined> {
    return this.call('get_entry', {
      address: id
    });
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    await this.call('clone_perspective', {
      previous_address: perspective.id,
      perspective: perspective.object
    });
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<void> {
    await this.call('clone_commit', {
      perspective_address: commit.id,
      commit: commit.object
    });
  }

  /**
   * @override
   */
  async updatePerspectiveDetails(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    await this.call('update_perspective_details', {
      perspective_address: perspectiveId,
      details: details
    });
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    const perspectivesResponse = await this.call('get_context_perspectives', {
      context: context
    });

    const perspectivesEntries: EntryResult<Signed<Perspective>>[] = this.parseEntriesResults(
      perspectivesResponse
    );
    return perspectivesEntries.filter(p => !!p).map(p => p.entry.id);
  }

  /**
   * @override
   */
  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    const result = await this.call('get_perspective_details', {
      perspective_address: perspectiveId
    });
    return this.parseResponse(result);
  }

  async cloneAndInitPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await this.clonePerspective(perspectiveData.perspective);
    return this.updatePerspectiveDetails(perspectiveData.perspective.id, perspectiveData.details);
    // TODO: addEditor
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const promises = newPerspectivesData.map(perspectiveData => this.cloneAndInitPerspective(perspectiveData));
    await Promise.all(promises);
  }
}
