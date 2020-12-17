import { html } from 'lit-html';

import { Logger } from '@uprtcl/micro-orchestrator';
import { KnownSourcesHttp, HttpProvider } from '@uprtcl/http-provider';
import { KnownSourcesService, CASStore } from '@uprtcl/multiplatform';

import {
  EveesRemote,
  PerspectiveDetails,
  NewPerspectiveData,
  Perspective,
  Secured,
  EveesHelpers,
} from '@uprtcl/evees';

import { EveesAccessControlHttp } from './evees-acl.http';
import { ProposalsHttp } from './proposals.http';

const evees_api: string = 'evees-v1';

export class EveesHttp implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;

  accessControl: EveesAccessControlHttp;
  proposals: ProposalsHttp;

  constructor(protected provider: HttpProvider, public store: CASStore) {
    this.accessControl = new EveesAccessControlHttp(this.provider);
    this.proposals = new ProposalsHttp(this.provider, this);
    this.knownSources = new KnownSourcesHttp(this.provider);
  }

  get id() {
    return this.provider.id;
  }
  get defaultPath() {
    return this.provider.defaultPath;
  }
  get userId() {
    return this.provider.userId;
  }

  async getHome(userId?: string) {
    return EveesHelpers.getHome(this, userId);
  }

  ready() {
    return Promise.resolve();
  }

  get casID() {
    return `http:store:${this.provider.pOptions.host}`;
  }

  canWrite(uref: string): Promise<boolean> {
    return this.accessControl.canWrite(uref);
  }

  async snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string,
    fromPerspectiveId?: string,
    fromHeadId?: string
  ): Promise<Secured<Perspective>> {
    return EveesHelpers.snapDefaultPerspective(
      this,
      undefined,
      context,
      timestamp,
      path,
      fromPerspectiveId,
      fromHeadId
    );
  }

  async createPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    await this.provider.post('/persp', {
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
    await this.provider.put(`/persp/${perspectiveId}/details`, details);
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return this.provider.getWithPut<any[]>(`/persp`, { context: context });
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    let responseObj: any = {};
    try {
      responseObj = await this.provider.getObject<PerspectiveDetails>(
        `/persp/${perspectiveId}/details`
      );
    } catch (e) {
      responseObj = {
        headId: undefined,
      };
    }

    return responseObj;
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    await this.provider.delete(`/persp/${perspectiveId}`);
  }

  connect() {
    return this.provider.connect();
  }
  isConnected() {
    return this.provider.isConnected();
  }
  disconnect() {
    return this.provider.disconnect();
  }
  isLogged() {
    return this.provider.isLogged();
  }
  login() {
    return this.provider.login();
  }
  logout() {
    return this.provider.logout();
  }
  icon(path?: string) {
    if (path) {
      const url = new URL(path);
      path = url.hostname;
    }
    return html`
      <uprtcl-icon-and-name
        name=${path ? path : 'unknown'}
        show-name
      ></uprtcl-icon-and-name>
    `;
  }
  avatar(userId: string, config: any = { showName: true }) {
    return html`
      <uprtcl-icon-and-name
        ?show-name=${config.showName}
        name=${userId}
      ></uprtcl-icon-and-name>
    `;
  }
}
