import { Ready } from '@uprtcl/cortex';

export interface DraftsProvider extends Ready {
  getDraft(elementId: string): Promise<any>;

  setDraft(elementId: string, content: any): Promise<void>;
}
