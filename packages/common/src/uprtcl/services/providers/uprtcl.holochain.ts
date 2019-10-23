import { Secured, Signed } from '@uprtcl/cortex';
import {
  HolochainConnectionOptions,
  ConnectionOptions,
  EntryResult,
  HolochainSource
} from '@uprtcl/connections';

import { Perspective, Commit } from '../../../types';
import { AccessControlMock } from '../../../access-control/access-control.mock';
import { UprtclRemote } from '../uprtcl.remote';

export class UprtclHolochain extends HolochainSource implements UprtclRemote {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    super('uprtcl', hcOptions, options);
  }

  get accessControlService() {
    return new AccessControlMock();
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
  async updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    await this.call('update_perspective_head', {
      perspective_address: perspectiveId,
      head_address: headId
    });
  }

  /**
   * @override
   */
  async updatePerspectiveContext(perspectiveId: string, context: string): Promise<void> {
    await this.call('update_perspective_context', {
      perspective_address: perspectiveId,
      context: context
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
  async getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    const result = await this.call('get_perspective_head', {
      perspective_address: perspectiveId
    });
    return this.parseResponse(result);
  }

  /**
   * @override
   */
  async getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    const result = await this.call('get_perspective_context', {
      perspective_address: perspectiveId
    });

    return this.parseResponse(result);
  }
}
