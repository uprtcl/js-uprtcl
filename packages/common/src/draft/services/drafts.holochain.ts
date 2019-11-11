import { DraftsProvider } from './drafts.provider';

import { HolochainConnection, HolochainProvider } from '@uprtcl/connections';

export class DraftsHolochain extends HolochainProvider implements DraftsProvider {
  constructor(instance: string, hcConnection: HolochainConnection) {
    super({ instance, zome: 'drafts' }, hcConnection);
  }

  /**
   * @override
   */
  async getDraft(elementId: string): Promise<any> {
    const content = await this.call('get_draft', { address: elementId });
    return JSON.parse(content);
  }

  /**
   * @override
   */
  async setDraft(elementId: string, content: any): Promise<void> {
    await this.call('set_draft', JSON.stringify(content));
  }
}
