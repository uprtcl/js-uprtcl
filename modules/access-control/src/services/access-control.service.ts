export interface AccessControlService<T> {
  getPermissions(hash: string): Promise<T | undefined>;
  setCanWrite(hash: string, userId: string): Promise<void>;
}
