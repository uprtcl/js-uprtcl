import { EntryResult, HolochainConnection, HolochainSource } from '@uprtcl/connections';
import { Signed } from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';

import { Perspective, Commit, PerspectiveDetails } from '../../../types';
import { EveesRemote } from '../../evees.remote';
import { ProposalMock } from '../../proposal.mock';

export class EveesHolochain extends HolochainSource implements EveesRemote {
  constructor(instance: string, hcConnection: HolochainConnection) {
    super({ zome: 'evees', instance }, hcConnection);
  }

  get accessControl() {
    return undefined;
  }

  get proposals() {
    return new ProposalMock();
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
  async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    const perspectivesResponse = await this.call('get_context_perspectives', {
      context: context
    });

    const perspectivesEntries: EntryResult<Signed<Perspective>>[] = this.parseEntriesResults(
      perspectivesResponse
    );
    return perspectivesEntries.filter(p => !!p).map(p => p.entry);
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
}
