import { HttpConnection, PostResult } from './http.connection';

export class HttpMultiConnection implements HttpConnection {
  constructor(
    readonly host: string,
    private connections: Map<string, HttpConnection>,
    private selected?: string
  ) {}

  select(selected: string) {
    this.selected = selected;
  }

  connection(): HttpConnection {
    if (this.selected) {
      const connection = this.connections.get(this.selected);
      if (!connection) throw new Error(`connection ${this.selected} not found.`);
      return connection;
    }
    throw new Error('Connection not selected');
  }

  public get<T>(url: string): Promise<T> {
    return this.connection().get<T>(url);
  }
  public getWithPut<T>(url: string, body: any): Promise<T> {
    return this.connection().getWithPut<T>(url, body);
  }
  public put(url: string, body: any): Promise<PostResult> {
    return this.connection().put(url, body);
  }
  public post(url: string, body: any): Promise<PostResult> {
    return this.connection().post(url, body);
  }
  public delete(url: string): Promise<PostResult> {
    return this.connection().delete(url);
  }
  public putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    return this.connection().putOrPost(url, body, method);
  }
}
