import { html } from 'lit-html';

import {
  Logger,
  RemoteEvees,
  PerspectiveDetails,
  NewPerspectiveData,
  Perspective,
  Secured,
  CASStore,
  PartialPerspective,
  snapDefaultPerspective,
  getHome,
  UpdateRequest,
  EveesMutation,
  SearchEngine,
  EveesMutationCreate,
  PerspectiveGetResult,
  CASRemote,
} from '@uprtcl/evees';

import { HttpConnectionLogged } from '@uprtcl/http-provider';

import { EveesAccessControlHttp } from './evees-acl.http';
import { ProposalsHttp } from './proposals.http';

const evees_api: string = 'evees-v1';

export class EveesHttp implements RemoteEvees {
  logger = new Logger('HTTP-EVEES-PROVIDER');

  accessControl: EveesAccessControlHttp;
  proposals: ProposalsHttp;
  store!: CASStore;
  searchEngine!: SearchEngine;

  constructor(public connection: HttpConnectionLogged, public storeRemote: CASRemote) {
    this.accessControl = new EveesAccessControlHttp(this.connection);
    this.proposals = new ProposalsHttp(this.connection);
  }

  get id() {
    return `http:${evees_api}`;
  }
  get defaultPath() {
    return this.connection.host;
  }
  get userId() {
    return this.connection.userId;
  }

  setStore(store: CASStore) {
    this.store = store;
  }

  async getHome(userId?: string) {
    return getHome(this, userId);
  }

  ready() {
    return Promise.resolve();
  }

  canUpdate(uref: string): Promise<boolean> {
    return this.accessControl.canUpdate(uref);
  }

  async snapPerspective(perspective: PartialPerspective): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
  }

  async update(mutation: EveesMutationCreate) {
    if (mutation.newPerspectives) {
      await this.newPerspectives(mutation.newPerspectives);
    }

    if (mutation.deletedPerspectives) {
      await Promise.all(
        mutation.deletedPerspectives.map((delPer) => this.deletePerspective(delPer))
      );
    }

    if (mutation.updates) {
      await Promise.all(mutation.updates.map((update) => this.updatePerspective(update)));
    }
  }
  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }
  async flush(): Promise<void> {}
  async refresh(): Promise<void> {}
  async getUserPerspectives(perspectiveId: string): Promise<string[]> {
    return [];
  }

  async newPerspectives(perspectivesData: NewPerspectiveData[]) {
    await this.connection.post('/persp', {
      perspectives: perspectivesData.map((perspectiveData) => {
        return {
          perspective: perspectiveData.perspective,
          details: perspectiveData.details,
          parentId: perspectiveData.links ? perspectiveData.links.parentId : undefined,
        };
      }),
    });
  }

  async newPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    this.newPerspectives([perspectiveData]);
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const promises = newPerspectivesData.map((perspectiveData) =>
      this.newPerspective(perspectiveData)
    );
    await Promise.all(promises);
  }

  async updatePerspective(update: UpdateRequest): Promise<void> {
    await this.connection.put(`/persp/details`, {
      details: [
        {
          id: update.perspectiveId,
          details: {
            headId: update.newHeadId,
            guardianId: update.guardianId,
          },
        },
      ],
    });
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return this.connection.getWithPut<any[]>(`/persp`, { context: context });
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    let responseObj: any = {};
    try {
      responseObj = await this.connection.get<PerspectiveDetails>(
        `/persp/${perspectiveId}/details`
      );
    } catch (e) {
      responseObj = {
        headId: undefined,
        canUpdate: false,
      };
    }

    return { details: responseObj };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    await this.connection.delete(`/persp/${perspectiveId}`);
  }

  connect() {
    return this.connection.connect();
  }
  isConnected() {
    return this.connection.isConnected();
  }
  disconnect() {
    return this.connection.disconnect();
  }
  isLogged() {
    return this.connection.isLogged();
  }
  login() {
    return this.connection.login();
  }
  logout() {
    return this.connection.logout();
  }
  icon(path?: string) {
    if (path) {
      const url = new URL(path);
      path = url.hostname;
    }
    return html`
      <uprtcl-icon-and-name name=${path ? path : 'unknown'} show-name></uprtcl-icon-and-name>
    `;
  }
  avatar(userId: string, config: any = { showName: true }) {
    return html`
      <uprtcl-icon-and-name ?show-name=${config.showName} name=${userId}></uprtcl-icon-and-name>
    `;
  }
}
