import { html } from 'lit-html';

import { Logger } from '@uprtcl/micro-orchestrator';
import {
  KnownSourcesHttp,
  HttpProvider,
  HttpStoreCached,
} from '@uprtcl/http-provider';
import { KnownSourcesService } from '@uprtcl/multiplatform';

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
import { EveesHttpCacheDB } from './evees.http.cache.db';

const evees_api: string = 'evees-v1';

export class EveesHttp implements EveesRemote {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  knownSources: KnownSourcesService;
  cache: EveesHttpCacheDB;

  accessControl: EveesAccessControlHttp;
  proposals: ProposalsHttp;

  constructor(protected provider: HttpProvider, public store: HttpStoreCached) {
    this.cache = new EveesHttpCacheDB(`evees-cache-${this.provider.id}`);
    this.accessControl = new EveesAccessControlHttp(this.provider, this.cache);
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
    return this.store.casID;
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
    const current = await this.cache.newPerspectives.get(
      perspectiveData.perspective.id
    );
    if (!current) {
      await this.cache.newPerspectives.put({
        id: perspectiveData.perspective.id,
        newPerspective: perspectiveData,
        context: perspectiveData.perspective.object.payload.context,
      });
    }
  }

  async flush() {
    this.logger.log('flusing');
    await this.store.flush();
    const newPerspectives = await this.cache.newPerspectives.toArray();

    this.logger.log('newPerspectives:', { newPerspectives });
    await this.provider.post('/persp', {
      perspectives: newPerspectives.map((np) => np.newPerspective),
    });

    const updates = await this.cache.updates.toArray();

    this.logger.log('updates:', { updates });
    await this.provider.put(`/persp/details`, {
      details: updates.map((update) => {
        return {
          id: update.id,
          details: {
            headId: update.head,
          },
        };
      }),
    });

    await this.cache.newPerspectives.clear();
    await this.cache.updates.clear();
    this.logger.log('flushing done');
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
    /** data must be in the backend to update a perspective */
    this.cache.updates.put({
      id: perspectiveId,
      head: details.headId as string,
    });
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    const perspectiveIds = await this.provider.getWithPut<any[]>(`/persp`, {
      context: context,
    });
    const cachedPerspectives = this.cache
      ? await this.cache.newPerspectives
          .where('context')
          .equals(context)
          .toArray()
      : [];

    return perspectiveIds.concat(cachedPerspectives.map((e) => e.id));
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails> {
    const cachedUpdate = await this.cache.updates.get(perspectiveId);
    if (cachedUpdate !== undefined) {
      return { headId: cachedUpdate.head };
    }

    const cachedNewPerspective = await this.cache.newPerspectives.get(
      perspectiveId
    );

    if (cachedNewPerspective !== undefined) {
      return cachedNewPerspective.newPerspective.details;
    }

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
