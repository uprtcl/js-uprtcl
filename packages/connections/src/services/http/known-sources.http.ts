import { KnownSourcesService } from '@uprtcl/cortex';
import {
  HttpConnection
} from './http.connection';
import { ConnectionOptions } from '../../connections/connection';
import { Logger } from '@uprtcl/micro-orchestrator';

export class KnownSourcesHttp implements KnownSourcesService {
  logger = new Logger('HTTP-KWN-SRC-PROVIDER');
  connection: HttpConnection;
  uprtcl_api: string = 'uprtcl-ks-v1';

  constructor(protected host: string, jwt: string) {
    this.connection = new HttpConnection(host, jwt, {});
  }

  ready() {
    return this.connection.ready();
  }

  async getOwnSource(): Promise<string> {
    return `http:${this.uprtcl_api}:+${this.host}`;
  }

  async getKnownSources(hash: string): Promise<string[]> {
    return this.connection.get(`/discovery/${hash}`);
  }
  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    await this.connection.put(`/discovery/${hash}`, sources);
  }

  async removeKnownSource(hash: string, source: string): Promise<void> {
    console.log({hash, source});
    throw new Error('Method not implemented');
  }
}
