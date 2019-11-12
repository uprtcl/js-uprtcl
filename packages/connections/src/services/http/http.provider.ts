import { HttpConnection, PostResult } from "./http.connection";
import { ServiceProvider, UplAuth } from "@uprtcl/cortex";

export interface HttpProviderOptions {
  host: string;
  apiId: string;
}

export class HttpProvider implements ServiceProvider {
  
  constructor (
    protected options: HttpProviderOptions,
    protected connection: HttpConnection) {
  }

  get uprtclProviderLocator(): string {
    return `http:${this.options.apiId}:${this.options.host}`;
  }
  
  get authInfo(): UplAuth {
    return {
      userId: this.connection.userId
    }
  }

  set authInfo(info: UplAuth) {
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