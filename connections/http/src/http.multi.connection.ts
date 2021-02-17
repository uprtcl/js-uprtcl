import { ConnectionLogged } from '@uprtcl/evees';
import { HttpAuthenticatedConnection } from './http.auth.connection.if';
import { HttpConnection, PostResult } from './http.connection';

export class HttpMultiConnection implements HttpConnection, ConnectionLogged {
  constructor(
    readonly host: string,
    private connections: Map<string, HttpAuthenticatedConnection>,
    private selected?: string
  ) {}

  select(selected: string) {
    this.selected = selected;
  }

  connection(): HttpAuthenticatedConnection {
    if (this.selected) {
      const connection = this.connections.get(this.selected);
      if (!connection) throw new Error(`connection ${this.selected} not found.`);
      return connection;
    }
    throw new Error('Connection not selected');
  }

  get userId() {
    return this.connection().userId;
  }

  connect(): Promise<void> {
    return this.connection().connect();
  }
  isConnected(): Promise<boolean> {
    return this.connection().isConnected();
  }
  disconnect(): Promise<void> {
    return this.connection().disconnect();
  }
  isLogged(): Promise<boolean> {
    return this.connection().isLogged();
  }
  login(): Promise<void> {
    return this.connection().login();
  }
  logout(): Promise<void> {
    return this.connection().logout();
  }

  get<T>(url: string): Promise<T> {
    return this.connection().get<T>(url);
  }
  getWithPut<T>(url: string, body: any): Promise<T> {
    return this.connection().getWithPut<T>(url, body);
  }
  put(url: string, body: any): Promise<PostResult> {
    return this.connection().put(url, body);
  }
  post(url: string, body: any): Promise<PostResult> {
    return this.connection().post(url, body);
  }
  delete(url: string): Promise<PostResult> {
    return this.connection().delete(url);
  }
  putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    return this.connection().putOrPost(url, body, method);
  }
}
