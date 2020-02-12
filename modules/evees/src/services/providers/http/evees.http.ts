import { HttpProvider, HttpConnection, KnownSourcesHttp } from '@uprtcl/http-provider';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { BasicAdminAccessControlService } from '@uprtcl/access-control';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { CidConfig } from '@uprtcl/ipfs-provider';

import { ProposalsProvider } from '../../proposals.provider';
import { EveesRemote } from '../../evees.remote';
import { PerspectiveDetails, Perspective } from '../../../types';
import { EveesAccessControlHttp } from './evees-access-control-http';
import { Secured } from 'src/uprtcl-evees';
import { KnownSourcesService } from '@uprtcl/multiplatform';
import { NewPerspectiveArgs } from 'src/services/evees';
import { NewPerspectiveData } from 'src/services/evees.provider';

const evees_api: string = 'evees-v1';

export class EveesHttp extends HttpProvider implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;

  accessControl: BasicAdminAccessControlService | undefined;
  proposals: ProposalsProvider | undefined;
  hashRecipe: CidConfig;

  constructor(
    host: string,
    protected connection: HttpConnection,
    hashRecipe: CidConfig
  ) {
    super(
      {
        host: host,
        apiId: evees_api
      },
      connection
    );

    this.accessControl =  new EveesAccessControlHttp();
    this.knownSources= new KnownSourcesHttp(host, this.connection);
    this.hashRecipe = hashRecipe;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  get userId() {
    return 'anonymous';
  }

  get source() {
    return `http:source:${this.options.host}`;
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    return super.getObject<Hashed<T>>(`/get/${hash}`);
  }

  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    await super.post('/persp', perspective);
  }

  async cloneAndInitPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await this.clonePerspective(perspectiveData.perspective);
    return this.updatePerspectiveDetails(perspectiveData.perspective.id, perspectiveData.details);
    // TODO: addEditor
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const promises = newPerspectivesData.map(perspectiveData => this.cloneAndInitPerspective(perspectiveData));
    await Promise.all(promises);
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
