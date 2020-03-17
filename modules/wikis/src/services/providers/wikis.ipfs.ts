import { IpfsStore } from '@uprtcl/ipfs-provider';

import { WikisProvider } from '../wikis.provider';
import { Wiki } from '../../types';

export class WikisIpfs extends IpfsStore implements WikisProvider {
  /**
   * @override
   */
  createWiki(wiki: Wiki): Promise<string> {
    return this.put(wiki);
  }
}
