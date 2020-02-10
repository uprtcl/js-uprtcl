import { injectable } from 'inversify';

import { HolochainProvider } from '@uprtcl/holochain-provider';
import { Hashed } from '@uprtcl/cortex';

import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';

@injectable()
export abstract class DocumentsHolochain extends HolochainProvider implements DocumentsProvider {
  zome: string = 'documents';

  source = '';
  hashRecipe: any;

  createTextNode(node: TextNode, hash?: string): Promise<string> {
    return this.call('create_text_node', {
      previous_address: hash,
      node: node
    });
  }

  public async get(id: string): Promise<Hashed<any> | undefined> {
    return this.call('get_entry', {
      address: id
    });
  }
}
