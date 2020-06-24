import { AccessControlService } from './access-control.service';

export interface DAOPermissions {
  type: string;
}

export interface OwnerAccessControlService extends AccessControlService<DAOPermissions> {
  addMember(ref: string, newMemberId: string): Promise<void>;
  removeMember(ref: string, newMemberId: string): Promise<void>;
}
