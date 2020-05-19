import { HttpEthAuthProvider, HttpConnection, KnownSourcesHttp } from '@uprtcl/http-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { BasicAdminAccessControlService } from '@uprtcl/access-control';
import { CidConfig, KnownSourcesService } from '@uprtcl/multiplatform';

import { ProposalsProvider } from '../../proposals.provider';
import { EveesRemote } from '../../evees.remote';
import { PerspectiveDetails, Perspective, Commit, NewPerspectiveData } from '../../../types';
import { EveesAccessControlHttp } from './evees-access-control-http';
import { Secured } from '../../../utils/cid-hash';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpEthAuthProvider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;

  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalsProvider | undefined;

  constructor(
    host: string,
    protected connection: HttpConnection,
    protected ethConnection: EthereumConnection,
    public cidConfig: CidConfig
  ) {
    super(
      {
        host: host,
        apiId: evees_api,
      },
      connection,
      ethConnection
    );

    this.accessControl = new EveesAccessControlHttp(host, this.connection);
    this.knownSources = new KnownSourcesHttp(host, this.connection);
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  get casID() {
    return `http:store:${this.options.host}`;
  }

  async get<T>(hash: string): Promise<T> {
    return super.getObject<T>(`/get/${hash}`);
  }

  async create(object: object, hash?: string | undefined): Promise<string> {
    const result = await super.httpPost(`/data`, {
      id: '',
      object: object,
    });
    return result.elementIds[0];
  }

  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    await super.httpPost('/persp', { perspective });
  }

  async cloneAndInitPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await super.httpPost('/persp', {
      perspective: perspectiveData.perspective,
      details: perspectiveData.details,
      parentId: perspectiveData.parentId,
    });
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const promises = newPerspectivesData.map((perspectiveData) =>
      this.cloneAndInitPerspective(perspectiveData)
    );
    await Promise.all(promises);
  }

  async cloneCommit(commit: any): Promise<void> {
    await super.httpPost('/commit', commit);
  }

  async updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    await super.httpPut(`/persp/${perspectiveId}/details`, details);
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return super.getWithPut<any[]>(`/persp`, { context: context });
  }

  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return super.getObject<PerspectiveDetails>(`/persp/${perspectiveId}/details`);
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    await super.httpDelete(`/persp/${perspectiveId}`);
  }
}
