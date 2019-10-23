export interface AccessControlService {
  canRead(hash: string, userId: string): Promise<boolean>;

  canWrite(hash: string, userId: string): Promise<boolean>;

  getAccessControlInformation(hash: string): Promise<object | undefined>;
}
