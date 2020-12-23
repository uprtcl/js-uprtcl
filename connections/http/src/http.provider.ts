import { Remote } from '@uprtcl/evees';

import { HttpConnection, PostResult } from './http.connection';

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export abstract class HttpProvider extends HttpConnection implements Remote {
  constructor(public pOptions: HttpProviderOptions) {
    super();
  }

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

  abstract isConnected(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract isLogged(): Promise<boolean>;
  abstract login(): Promise<void>;
  abstract logout(): Promise<void>;
}
