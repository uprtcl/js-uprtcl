export interface EveesDrafts {
  setDraft(ref: string, object: any): Promise<void>;

  getDraft(ref: string): Promise<any>;

  removeDraft(ref: string): Promise<void>;
}
