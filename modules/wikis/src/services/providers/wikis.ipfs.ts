import { IpfsSource } from '@uprtcl/connections';

import { WikisProvider } from '../wikis.provider';
import { Wiki } from '../../types';

export class WikisIpfs extends IpfsSource implements WikisProvider {

  /**
   * @override
   */
  createWiki(wiki: Wiki): Promise<string> {
    return this.addObject(wiki);
  }
}
