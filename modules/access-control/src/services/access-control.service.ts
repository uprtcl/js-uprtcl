export interface AccessControlService<T> {
  getPermissions(hash: string): Promise<T | undefined>;
  setPermissions(hash: string, newPersmissions: T): Promise<void>;
  setCanWrite(hash: string, userId: string): Promise<void>;
}
