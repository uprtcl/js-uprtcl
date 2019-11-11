import { HttpConnection } from '@uprtcl/connections';
import { Hashed } from '@uprtcl/cortex';

import { DocumentsProvider } from './documents.provider';
import { TextNode } from '../types';

export enum DataType {
  TEXT = 'TEXT',
  TEXT_NODE = 'TEXT_NODE',
  DOCUMENT_NODE = 'DOCUMENT_NODE'
}

export class DocumentsHttp implements DocumentsProvider {

  connection!: HttpConnection;

  constructor (protected host: string, jwt: string) {
    this.connection = new HttpConnection(host, jwt, {});
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

  async get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    const object = await this.connection.get<T>(`/data/${hash}`);
    return {
      id: hash,
      object: object
    }
  }

  
  async createTextNode(node: TextNode): Promise<string> {
    const result = await this.connection.post(`/data`, {
      type: DataType.DOCUMENT_NODE,
      data: node
    });
    return result.elementIds[0];
  }
}
