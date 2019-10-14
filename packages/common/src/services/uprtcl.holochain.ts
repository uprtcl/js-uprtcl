import { Secured, Signed, Hashed } from '@uprtcl/cortex';
import {
  HolochainConnectionOptions,
  ConnectionOptions,
  EntryResult,
  HolochainSource
} from '@uprtcl/connections';
import { UprtclProvider } from './uprtcl.provider';
import { Context, Perspective, Commit } from '../types';

export class UprtclHolochain extends HolochainSource implements UprtclProvider {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    super('uprtcl', hcOptions, options);
  }

  async createPerspective(name: string, timestamp: number): Promise<Secured<Perspective>> {
    const perspectiveId = await this.call('create_perspective', {
      name,
      timestamp
    });

    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);

    if (!perspective) throw new Error('Error creating the perspective');

    return perspective;
  }

  async createCommit(
    dataId: string,
    parentsIds: string[],
    message: string,
    timestamp: number
  ): Promise<Secured<Commit>> {
    const commitId = await this.call('create_commit', {
      dataId,
      parentsIds,
      message,
      timestamp
    });

    const commit: Secured<Commit> | undefined = await this.get(commitId);

    if (!commit) throw new Error('Error creating the context');

    return commit;
  }

  clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    return this.call('clone_perspective', {
      previous_addres: perspective.id,
      perspective: perspective.object
    });
  }

  cloneCommit(commit: Secured<Commit>): Promise<string> {
    return this.call('clone_commit', {
      perspective_address: commit.id,
      commit: commit.object
    });
  }

  updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    return this.call('update_perspective_head', {
      perspective_address: perspectiveId,
      head_address: headId
    });
  }

  updatePerspectiveContext(perspectiveId: string, context: string): Promise<void> {
    return this.call('update_perspective_context', {
      perspective_address: perspectiveId,
      context: context
    });
  }

  async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    const perspectivesResponse = await this.call('getperspectives', {
      context: context
    });

    const perspectivesEntries: EntryResult<Signed<Perspective>>[] = this.parseEntriesResults(
      perspectivesResponse
    );
    return perspectivesEntries.filter(p => !!p).map(p => p.entry);
  }

  async getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    return await this.call('get_perspective_head', {
      perspective_address: perspectiveId
    });
  }

  async getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    return await this.call('get_perspective_context', {
      perspective_address: perspectiveId
    });
  }
}
