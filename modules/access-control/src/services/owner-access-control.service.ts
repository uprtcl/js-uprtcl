import { AccessControlService } from './access-control.service';

export interface OwnerPermissions {
  owner: string;
}

export interface OwnerAccessControlService
  extends AccessControlService<OwnerPermissions> {
  changeOwner(uref: string, newOwnerId: string): Promise<void>;
}
