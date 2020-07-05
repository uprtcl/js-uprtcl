export interface AccessControlService<T> {
  getPermissions(uref: string): Promise<T | undefined>;
  setPermissions(uref: string, newPersmissions: T): Promise<void>;
  setCanWrite(urefs: string, userId: string): Promise<void>;
}
