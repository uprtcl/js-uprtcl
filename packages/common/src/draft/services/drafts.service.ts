import { CachedService } from '@uprtcl/cortex';

import { DraftsProvider } from './drafts.provider';

export class DraftsService implements DraftsProvider {
  cachedDraft: CachedService<DraftsProvider>;

  constructor(protected local: DraftsProvider, protected remote: DraftsProvider) {
    this.cachedDraft = new CachedService<DraftsProvider>(local, remote);
  }

  /**
   * @override
   */
  ready() {
    return this.cachedDraft.ready();
  }

  /**
   * @override
   */
  getDraft(elementId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  updateDraft(elementId: string, content: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
