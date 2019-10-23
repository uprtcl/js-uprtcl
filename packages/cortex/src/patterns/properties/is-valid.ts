export interface IsValid {
  validate: (object: any) => Promise<boolean>;
}
