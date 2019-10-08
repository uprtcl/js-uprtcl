import { Secured, Signed, Hashed } from '@uprtcl/cortex';
import {
  HolochainConnectionOptions,
  ConnectionOptions,
  EntryResult,
  HolochainSource
} from '@uprtcl/connections';
import { UprtclProvider } from './uprtcl.provider';
import { Context, Perspective, Commit } from '../../types';

export class UprtclHolochain extends HolochainSource implements UprtclProvider {
  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    super('uprtcl', hcOptions, options);
  }

  async createContext(timestamp: number, nonce: number): Promise<Secured<Context>> {
    const contextId = await this.call('create_context', {
      timestamp,
      nonce
    });

    const context: Secured<Context> | undefined = await this.get(contextId);

    if (!context) throw new Error('Error creating the context');

    return context;
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

  cloneContext(context: Secured<Context>): Promise<string> {
    throw new Error('Method not implemented.');
  }
  clonePerspective(perspective: Secured<Perspective>): Promise<string> {
    throw new Error('Method not implemented.');
  }
  cloneCommit(commit: Secured<Commit>): Promise<string> {
    throw new Error('Method not implemented.');
  }

  updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    return this.call('update_perspective_head', {
      perspective_address: perspectiveId,
      head_address: headId
    });
  }

  updatePerspectiveContext(perspectiveId: string, contextId: string): Promise<void> {
    return this.call('update_perspective_context', {
      perspective_address: perspectiveId,
      context_address: contextId
    });
  }

  async getContextPerspectives(contextId: string): Promise<Secured<Perspective>[]> {
    const perspectivesResponse = await this.call('get_context_perspectives', {
      context_address: contextId
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
