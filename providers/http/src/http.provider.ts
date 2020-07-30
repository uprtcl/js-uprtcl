import { Remote } from '@uprtcl/access-control';

import { HttpConnection, PostResult } from './http.connection';

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export class HttpProvider implements Remote {
  constructor(
    protected options: HttpProviderOptions,
    protected connection: HttpConnection
  ) {}

  get id(): string {
    return `http:${this.options.apiId}`;
  }

  get defaultPath(): string {
    return `${this.options.host}`;
  }

  get userId() {
    return this.connection.userId;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  async getObject<T>(url: string): Promise<T> {
    const object: any = await this.connection.get<T>(this.options.host + url);

    if ((object as { object: any }).object) return object.object as T;
    return object as T;
  }

  getWithPut<T>(url: string, body: any): Promise<T> {
    return this.connection.getWithPut<T>(this.options.host + url, body);
  }

  httpPut(url: string, body: any): Promise<PostResult> {
    return this.connection.put(this.options.host + url, body);
  }

  httpPost(url: string, body: any): Promise<PostResult> {
    return this.connection.post(this.options.host + url, body);
  }

  httpDelete(url: string): Promise<PostResult> {
    return this.connection.delete(this.options.host + url);
  }

  isLogged(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  login(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  connect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  isConnected(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
