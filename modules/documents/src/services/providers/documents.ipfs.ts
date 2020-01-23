import { IpfsSource } from '@uprtcl/ipfs-provider';

import { DocumentsProvider } from '../documents.provider';
import { TextNode } from '../../types';

export class DocumentsIpfs extends IpfsSource implements DocumentsProvider {

  /**
   * @override
   */
  createTextNode(node: TextNode): Promise<string> {
    return this.addObject(node);
  }
}
