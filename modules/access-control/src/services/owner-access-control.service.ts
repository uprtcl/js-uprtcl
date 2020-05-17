import { AccessControlService } from './access-control.service';

export interface OwnerPermissions {
  owner: string;
}

export interface OwnerAccessControlService extends AccessControlService<OwnerPermissions> {
  changeOwner(ref: string, newOwnerId: string): Promise<void>;
}
