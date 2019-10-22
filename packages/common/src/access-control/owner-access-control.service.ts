import { AccessControlService } from './access-control.service';

export interface OwnerAccessControlService extends AccessControlService {
  changeOwner(hash: string, newOwnerId: string): Promise<void>;
}
