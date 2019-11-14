import { IpfsSource } from '@uprtcl/connections';

import { WikisProvider } from '../wikis.provider';
import { WikiNode } from '../../types';

export class WikisIpfs extends IpfsSource implements WikisProvider {

  /**
   * @override
   */
  createWikiNode(node: WikiNode): Promise<string> {
    return this.addObject(node);
  }
}
