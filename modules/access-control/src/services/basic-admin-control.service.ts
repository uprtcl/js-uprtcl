import { AccessControlService } from './access-control.service';

export enum PermissionType {
  Read = 'Read',
  Write = 'Write',
  Admin = 'Admin',
}

export interface BasicAdminPermissions {
  publicWrite: boolean;
  publicRead: boolean;
  canRead: string[];
  canWrite: string[];
  canAdmin: string[];
}

export interface BasicAdminAccessControlService
  extends AccessControlService<BasicAdminPermissions> {}
