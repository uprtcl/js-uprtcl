import { HttpProvider, HttpConnection } from '@uprtcl/connections';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed, UplAuth } from '@uprtcl/cortex';
import { BasicAdminAccessControlService } from '@uprtcl/common';

import { ProposalsProvider } from '../../proposals.provider';
import { EveesRemote } from '../../evees.remote';
import { PerspectiveDetails } from '../../../types';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpProvider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalsProvider | undefined;

  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: evees_api
      },
      connection
    );
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    return super.getObject<Hashed<T>>(`/get/${hash}`);
  }

  async clonePerspective(perspective: any): Promise<void> {
    await super.post('/persp', perspective);
  }

  async cloneCommit(commit: any): Promise<void> {
    await super.post('/commit', commit);
  }

  async updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    await super.put(`/persp/${perspectiveId}/details`, details);
  }

  getContextPerspectives(context: string): Promise<any[]> {
    return super.getWithPut<any[]>(`/persp`, { context: context });
  }

  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return super.getObject<PerspectiveDetails>(`/persp/${perspectiveId}/details`);
  }
}
