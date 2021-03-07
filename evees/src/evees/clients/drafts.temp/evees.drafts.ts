export interface EveesDrafts {
  setDraft(uref: string, object: any): Promise<void>;

  getDraft(uref: string): Promise<any>;

  removeDraft(uref: string): Promise<void>;
}
