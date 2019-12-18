import { ServiceProvider } from '@uprtcl/cortex';

import { HttpConnection, PostResult } from './http.connection';

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export class HttpProvider implements ServiceProvider {
  constructor(protected options: HttpProviderOptions, protected connection: HttpConnection) {}

  get uprtclProviderLocator(): string {
    const url = new URL(this.options.host);
    return `http:${this.options.apiId}:${url.hostname}`;
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

  put(url: string, body: any): Promise<PostResult> {
    return this.connection.put(this.options.host + url, body);
  }

  post(url: string, body: any): Promise<PostResult> {
    return this.connection.post(this.options.host + url, body);
  }
}
