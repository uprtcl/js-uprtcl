import { injectable } from 'inversify';

import { HolochainConnection, HolochainProvider, proxyMyAddress } from '@uprtcl/connections';

import { DraftsProvider } from './drafts.provider';

@injectable()
export class DraftsHolochain extends HolochainProvider implements DraftsProvider {
  constructor(instance: string, hcConnection: HolochainConnection) {
    super(
      {
        instance,
        zome: 'drafts',
        getMyAddress: proxyMyAddress(instance)
      },
      hcConnection
    );
  }

  /**
   * @override
   */
  async getDraft(elementId: string): Promise<any> {
    const draft = await this.call('get_draft', { address: elementId });
    return JSON.parse(draft);
  }

  /**
   * @override
   */
  async updateDraft(elementId: string, draft: any): Promise<void> {
    await this.call('update_draft', {
      address: elementId,
      draft: JSON.stringify(draft)
    });
  }
}
