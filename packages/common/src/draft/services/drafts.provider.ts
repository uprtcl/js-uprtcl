import { Ready } from '@uprtcl/cortex';

export interface DraftsProvider extends Ready {
  getDraft(elementId: string): Promise<any>;

  updateDraft(elementId: string, draft: any): Promise<void>;
}
