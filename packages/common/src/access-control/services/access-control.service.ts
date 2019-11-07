export interface AccessControlService<T> {
  canRead(hash: string): Promise<boolean>;

  canWrite(hash: string): Promise<boolean>;

  getAccessControlInformation(hash: string): Promise<T | undefined>;
}
