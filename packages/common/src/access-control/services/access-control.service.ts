export interface AccessControlService {
  canRead(hash: string): Promise<boolean>;

  canWrite(hash: string): Promise<boolean>;

  getAccessControlInformation(hash: string): Promise<object | undefined>;
}
