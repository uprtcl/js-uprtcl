import { html } from 'lit-html';

import {
  Logger,
  RemoteEvees,
  GetPerspectiveOptions,
  NewPerspective,
  Perspective,
  Secured,
  CASStore,
  PartialPerspective,
  snapDefaultPerspective,
  getHome,
  Update,
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

  async newPerspectives(perspectivesData: NewPerspective[]) {
    await this.connection.post('/persp', {
      perspectives: perspectivesData.map((perspectiveData) => {
        return {
          perspective: perspectiveData.perspective,
          update: perspectiveData.update,
        };
      }),
    });
  }

  async newPerspective(perspectiveData: NewPerspective): Promise<void> {
    this.newPerspectives([perspectiveData]);
  }

  async createPerspectiveBatch(newPerspectivesData: NewPerspective[]): Promise<void> {
    const promises = newPerspectivesData.map((perspectiveData) =>
      this.newPerspective(perspectiveData)
    );
    await Promise.all(promises);
  }

  async updatePerspective(update: Update): Promise<void> {
    await this.connection.put(`/persp/update`, {
      updates: [update],
    });
  }

  async getContextPerspectives(context: string): Promise<string[]> {
    return this.connection.getWithPut<any[]>(`/persp`, { context: context });
  }

  async getPerspective(
    perspectiveId: string,
    options: GetPerspectiveOptions = {
      levels: 0,
      entities: true,
    }
  ): Promise<PerspectiveGetResult> {
    let result: PerspectiveGetResult = {
      details: {},
    };

    /** add default values for case where options is partially provided */
    options.entities = options.entities === undefined ? true : options.entities;
    options.levels = options.levels === undefined ? 0 : options.levels;

    if (options.levels !== 0 && options.levels !== -1) {
      throw new Error(`Levels can only be 0 (shallow get) or -1, fully recusive`);
    }

    try {
      result = await this.connection.getWithPut<PerspectiveGetResult>(
        `/persp/${perspectiveId}`,
        options
      );
    } catch (e) {
      this.logger.warn(`Error fetching perspective ${perspectiveId}`, e);
    }

    return result;
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
