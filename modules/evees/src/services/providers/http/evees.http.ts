import { HttpProvider, HttpConnection, KnownSourcesHttp } from '@uprtcl/http-provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { BasicAdminAccessControlService } from '@uprtcl/access-control';
import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ProposalsProvider } from '../../proposals.provider';
import { EveesRemote } from '../../evees.remote';
import { PerspectiveDetails } from '../../../types';
import { EveesAccessControlHttp } from './evees-access-control-http';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpProvider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources = new KnownSourcesHttp(this.options.host, this.connection);

  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalsProvider | undefined;

  constructor(
    host: string,
    protected connection: HttpConnection,
    protected ethConnection: EthereumConnection
  ) {
    super(
      {
        host: host,
        apiId: evees_api
      },
      connection
    );

    this.accessControl =  new EveesAccessControlHttp();
  }

  get userId() {
    return this.ethConnection.getCurrentAccount();
  }

  get source() {
    return `http:source:${this.options.host}`;
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

  getContextPerspectives(context: string): Promise<string[]> {
    return super.getWithPut<any[]>(`/persp`, { context: context });
  }

  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return super.getObject<PerspectiveDetails>(`/persp/${perspectiveId}/details`);
  }
}
