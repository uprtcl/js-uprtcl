import { HttpEthAuthProvider, HttpConnection, KnownSourcesHttp } from '@uprtcl/http-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { BasicAdminAccessControlService } from '@uprtcl/access-control';
import { CidConfig } from '@uprtcl/ipfs-provider';

import { ProposalsProvider } from '../../proposals.provider';
import { EveesRemote } from '../../evees.remote';
import { PerspectiveDetails, Perspective } from '../../../types';
import { EveesAccessControlHttp } from './evees-access-control-http';
import { KnownSourcesService } from '@uprtcl/multiplatform';
import { NewPerspectiveData } from '../../evees.provider';
import { Secured } from '../../../patterns/default-secured.pattern';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpEthAuthProvider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;

  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalsProvider | undefined;
  hashRecipe: CidConfig;

  constructor(
    host: string,
    protected connection: HttpConnection,
    protected ethConnection: EthereumConnection,
    hashRecipe: CidConfig
  ) {
    super(
      {
        host: host,
        apiId: evees_api
      },
      connection,
      ethConnection
    );

    this.accessControl = new EveesAccessControlHttp(host, this.connection);
    this.knownSources= new KnownSourcesHttp(host, this.connection);
    this.hashRecipe = hashRecipe;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  get source() {
    return `http:source:${this.options.host}`;
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    return super.getObject<Hashed<T>>(`/get/${hash}`);
  }

  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    await super.httpPost('/persp', { perspective });
  }

  async cloneAndInitPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await super.httpPost('/persp', {
      perspective: perspectiveData.perspective, 
      details: perspectiveData.details,
      parentId: perspectiveData.parentId
    });
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const promises = newPerspectivesData.map(perspectiveData => this.cloneAndInitPerspective(perspectiveData));
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

  getContextPerspectives(context: string): Promise<string[]> {
    return super.getWithPut<any[]>(`/persp`, { context: context });
  }

  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return super.getObject<PerspectiveDetails>(`/persp/${perspectiveId}/details`);
  }
}
