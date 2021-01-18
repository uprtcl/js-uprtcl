import { CASStore, Perspective, Proposals, RemoteEvees, Secured } from '@uprtcl/evees';
import {
  PerspectiveGetResult,
  EveesMutationCreate,
  EveesMutation,
} from '@uprtcl/evees/dist/types/evees/interfaces/client';
import { SearchEngine } from '@uprtcl/evees/dist/types/evees/interfaces/search.engine';
import {
  NewPerspectiveData,
  PartialPerspective,
  PerspectiveLinks,
  UpdateRequest,
} from '@uprtcl/evees/dist/types/evees/interfaces/types';

import { HttpConnection, PostResult } from './http.connection';

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export abstract class HttpProvider extends HttpConnection implements RemoteEvees {
  constructor(public pOptions: HttpProviderOptions) {
    super();
  }
  store!: CASStore;
  searchEngine!: SearchEngine;
  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    throw new Error('Method not implemented.');
  }
  update(mutation: EveesMutationCreate) {
    throw new Error('Method not implemented.');
  }
  newPerspective(newPerspective: NewPerspectiveData) {
    throw new Error('Method not implemented.');
  }
  deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }
  updatePerspective(update: UpdateRequest) {
    throw new Error('Method not implemented.');
  }
  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  accessControl: any;
  proposals?: Proposals | undefined;

  get id(): string {
    return `http:${this.pOptions.apiId}`;
  }

  get defaultPath(): string {
    return `${this.pOptions.host}`;
  }

  get userId() {
    return super.userId;
  }

  set userId(_userId: string | undefined) {
    super.userId = _userId;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  async getObject<T>(url: string): Promise<T> {
    const object: any = await super.get<T>(this.pOptions.host + url);

    if ((object as { object: any }).object) return object.object as T;
    return object as T;
  }

  getWithPut<T>(url: string, body: any): Promise<T> {
    return super.getWithPut<T>(this.pOptions.host + url, body);
  }

  put(url: string, body: any): Promise<PostResult> {
    return super.put(this.pOptions.host + url, body);
  }

  post(url: string, body: any): Promise<PostResult> {
    return super.post(this.pOptions.host + url, body);
  }

  delete(url: string): Promise<PostResult> {
    return super.delete(this.pOptions.host + url);
  }

  snapPerspective(
    perspective: PartialPerspective,
    links?: PerspectiveLinks
  ): Promise<Secured<Perspective>> {
    throw new Error('Method not implemented.');
  }

  abstract isConnected(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract isLogged(): Promise<boolean>;
  abstract login(): Promise<void>;
  abstract logout(): Promise<void>;
}
