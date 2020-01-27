import { HttpConnection, HttpProvider } from '@uprtcl/http-provider';
import { Hashed } from '@uprtcl/cortex';

import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';
import { injectable } from 'inversify';

export enum DataType {
  TEXT = 'TEXT',
  TEXT_NODE = 'TEXT_NODE',
  DOCUMENT_NODE = 'DOCUMENT_NODE'
}

const documents_api: string = 'source';

export class DocumentsHttp extends HttpProvider implements DocumentsProvider {
  get source() {
    return `http:${documents_api}:${this.options.host}`;
  }

  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: documents_api
      },
      connection
    );
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    return super.getObject<Hashed<T>>(`/get/${hash}`);
  }

  async createTextNode(node: TextNode, hash: string): Promise<string> {
    const result = await super.post(`/data`, {
      id: hash,
      object: node
    });
    return result.elementIds[0];
  }
}
