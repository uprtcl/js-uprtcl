export interface AccessControlService<T> {
  getPermissions(hash: string): Promise<T | undefined>;
}
