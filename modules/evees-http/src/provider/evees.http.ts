import { Logger } from '@uprtcl/micro-orchestrator';
import {
  HttpEthAuthProvider,
  HttpAuth0Provider,
  HttpConnection,
  KnownSourcesHttp,
} from '@uprtcl/http-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { KnownSourcesService, CASStore } from '@uprtcl/multiplatform';

import {
  ProposalsProvider,
  EveesRemote,
  PerspectiveDetails,
  NewPerspectiveData,
  AccessControlService,
} from '@uprtcl/evees';

import { EveesAccessControlHttp } from './evees-acl.http';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpAuth0Provider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;

  accessControl: EveesAccessControlHttp;
  proposals: ProposalsProvider | undefined;

  constructor(
    host: string,
    protected connection: HttpConnection,
    protected auth0Config: any,
    public store: CASStore
  ) {
    super(
      {
        host: host,
        apiId: evees_api,
      },
      connection,
      auth0Config
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

  canWrite(uref: string): Promise<boolean> {
    return this.accessControl.canWrite(uref, this.userId);
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await super.httpPost('/persp', {
      perspective: perspectiveData.perspective,
      details: perspectiveData.details,
      parentId: perspectiveData.parentId,
    });
  }

  async createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void> {
    const promises = newPerspectivesData.map((perspectiveData) =>
      this.createPerspective(perspectiveData)
    );
    await Promise.all(promises);
  }

  async updatePerspective(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    await super.httpPut(`/persp/${perspectiveId}/details`, details);
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return super.getWithPut<any[]>(`/persp`, { context: context });
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    return super.getObject<PerspectiveDetails>(
      `/persp/${perspectiveId}/details`
    );
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    await super.httpDelete(`/persp/${perspectiveId}`);
  }
}
