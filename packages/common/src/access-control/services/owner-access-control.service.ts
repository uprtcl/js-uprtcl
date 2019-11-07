import { AccessControlService } from './access-control.service';

export interface OwnerAccessControl {
  owner: string;
}

export interface OwnerAccessControlService extends AccessControlService<OwnerAccessControl> {
  changeOwner(hash: string, newOwnerId: string): Promise<void>;
}
