import {
  HolochainConnectionOptions,
  ConnectionOptions,
  EntryResult,
  HolochainSource
} from '@uprtcl/connections';
import { Signed } from '@uprtcl/cortex';

import { Perspective, Commit, PerspectiveDetails } from '../../../../types';
import { AccessControlMock } from '../../../../access-control/services/access-control.mock';
import { UprtclRemote } from '../../uprtcl.remote';
import { ProposalMock } from '../../proposal.mock';
import { Secured } from '../../../../patterns/default-secured.pattern';

export class UprtclHolochain extends HolochainSource implements UprtclRemote {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    super('uprtcl', hcOptions, options);
  }

  get accessControl() {
    return new AccessControlMock();
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
