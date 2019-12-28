export interface AccessControlService<T> {
  getAccessControlInformation(hash: string): Promise<T | undefined>;
}
