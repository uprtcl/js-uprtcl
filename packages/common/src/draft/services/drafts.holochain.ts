import { DraftsProvider } from './drafts.provider';

import {
  HolochainConnectionOptions,
  ConnectionOptions,
  HolochainConnection
} from '@uprtcl/connections';

export class DraftsHolochain implements DraftsProvider {
  draftsZome: HolochainConnection;

  constructor(hcOptions: HolochainConnectionOptions, options: ConnectionOptions = {}) {
    this.draftsZome = new HolochainConnection('drafts', hcOptions, options);
  }

  /**
   * @override
   */
  ready() {
    return this.draftsZome.ready();
  }

  /**
   * @override
   */
  async getDraft(elementId: string): Promise<any> {
    const content = await this.draftsZome.call('get_draft', { address: elementId });
    return JSON.parse(content);
  }

  /**
   * @override
   */
  async setDraft(elementId: string, content: any): Promise<void> {
    await this.draftsZome.call('set_draft', JSON.stringify(content));
  }
}
