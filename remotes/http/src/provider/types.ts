export enum PermissionType {
  Read = 'Read',
  Write = 'Write',
  Admin = 'Admin',
}

export interface BasicAdminPermissions {
  publicWrite: boolean;
  publicRead: boolean;
  canRead: string[];
  canUpdate: string[];
  canAdmin: string[];
}

export interface BasicAdminInheritedPermissions {
  delegate: boolean;
  delegateTo?: string | null;
  finDelegatedTo?: string | null;
  customPermissions?: BasicAdminPermissions;
  effectivePermissions: BasicAdminPermissions;
}

export interface UserPermissions {
  canRead: boolean;
  canUpdate: boolean;
  canAdmin: boolean;
}
