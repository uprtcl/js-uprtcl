import { Authority } from '@uprtcl/multiplatform';

import { HttpConnection, PostResult } from './http.connection';

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export class HttpProvider implements Authority {
  constructor(protected options: HttpProviderOptions, protected connection: HttpConnection) {}

  get authority(): string {
    return `http:${this.options.apiId}:${this.options.host}`;
  }

  get userId() {
    return this.connection.userId;
  }

  set authInfo(info) {
    this.connection.userId = info.userId;
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  getObject<T>(url: string): Promise<T> {
    return this.connection.get<T>(this.options.host + url);
  }

  getWithPut<T>(url: string, body: any): Promise<T> {
    return this.connection.getWithPut<T>(this.options.host + url, body);
  }

  put(url: string, body: any): Promise<PostResult> {
    return this.connection.put(this.options.host + url, body);
  }

  post(url: string, body: any): Promise<PostResult> {
    return this.connection.post(this.options.host + url, body);
  }
}
