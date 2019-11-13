import Dexie from 'dexie';
import { DraftsProvider } from './drafts.provider';

export class DraftsLocal extends Dexie implements DraftsProvider {
  drafts: Dexie.Table<any, string>;

  constructor() {
    super('draft');
    this.version(0.1).stores({
      drafts: ''
    });
    this.drafts = this.table('drafts');
  }

  /**
   * @override
   */
  ready() {
    return Promise.resolve();
  }

  /**
   * @override
   */
  getDraft(elementId: string): Promise<any> {
    return this.drafts.get(elementId);
  }

  /**
   * @override
   */
  async updateDraft(elementId, content: any): Promise<void> {
    await this.drafts.put(content, elementId);
  }
}
