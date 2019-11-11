import { AccessControlService } from './access-control.service';

export enum PermissionType {
  Read = 'Read',
  Write = 'Write',
  Admin = 'Admin'
}

export interface BasicAdminAccessControl {
  publicWrite: boolean;
  publicRead: boolean;
  canRead: string[];
  canWrite: string[];
  canAdmin: string[];
}

export interface BasicAdminAccessControlService extends AccessControlService<BasicAdminAccessControl> {
  setPublic(hash: string, value: boolean, type: PermissionType): Promise<void>;
  addCan(hash: string, newOwnerId: string, type: PermissionType): Promise<void>;
  removeCan(hash: string, newOwnerId: string, type: PermissionType): Promise<void>;
}
