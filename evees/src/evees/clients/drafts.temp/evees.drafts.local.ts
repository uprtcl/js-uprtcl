import { EveesDraftsDB } from './evees.drafts.db';
import { EveesDrafts } from './evees.drafts';

export class EveesDraftsLocal implements EveesDrafts {
  eveesDB = new EveesDraftsDB();

  removeDraft(objectId: string): Promise<void> {
    return this.eveesDB.drafts.delete(objectId);
  }

  getDraft(objectId: string): Promise<any> {
    return this.eveesDB.drafts.get(objectId);
  }

  async setDraft(objectId: string, draft: any): Promise<void> {
    await this.eveesDB.drafts.put(draft, objectId);
  }
}
