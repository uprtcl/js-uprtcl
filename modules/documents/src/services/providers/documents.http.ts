import { HttpConnection, HttpProvider } from '@uprtcl/connections';
import { Hashed } from '@uprtcl/cortex';

import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';
import { injectable } from 'inversify';

export enum DataType {
  TEXT = 'TEXT',
  TEXT_NODE = 'TEXT_NODE',
  DOCUMENT_NODE = 'DOCUMENT_NODE'
}

const documents_api: string = 'documents-v1';

export class DocumentsHttp extends HttpProvider implements DocumentsProvider {
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
    const object = await super.getObject<T>(`/get/${hash}`);
    return {
      id: hash,
      object: object
    };
  }

  async createTextNode(node: TextNode, hash: string): Promise<string> {
    const result = await super.post(`/data`, {
      id: hash,
      type: DataType.DOCUMENT_NODE,
      data: node
    });
    return result.elementIds[0];
  }
}
