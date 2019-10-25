import { AccessControlService } from './access-control.service';

export interface InvitationAccessControl extends AccessControlService {
  inviteToCollaborate(hash: string, collaboratorId: string): Promise<void>;
}
