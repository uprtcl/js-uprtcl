export interface AccessControlService<T> {
  getPermissions(ref: string): Promise<T | undefined>;
  setPermissions(ref: string, newPersmissions: T): Promise<void>;
  setCanWrite(refs: string, userId: string): Promise<void>;
}
