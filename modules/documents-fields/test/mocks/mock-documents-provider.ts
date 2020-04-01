import { KnownSourcesService } from '@uprtcl/multiplatform';

import { TextNode } from '../../src/types';
import { DocumentsProvider } from '../../src/services/documents.provider';
import { Hashed } from '@uprtcl/cortex';
import { Dictionary } from '@uprtcl/micro-orchestrator';

export class MockDocumentsProvider implements DocumentsProvider {
  source: string = '';
  hashRecipe: any;
  knownSources?: KnownSourcesService;

  constructor(public nodes: Dictionary<Hashed<TextNode>> = {}) {}

  async ready(): Promise<void> {
    return;
  }

  async get(hash: string): Promise<Hashed<any>> {
    return this.nodes[hash];
  }

  async createTextNodeFields(node: TextNode, hash?: string): Promise<string> {
    this.nodes[hash as string] = { id: hash as string, object: node };
    return hash as string;
  }
}
