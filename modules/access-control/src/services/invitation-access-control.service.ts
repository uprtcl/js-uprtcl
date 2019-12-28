import { AccessControlService } from './access-control.service';

export interface InvitationAccessControl extends AccessControlService<any> {
  inviteToCollaborate(hash: string, collaboratorId: string): Promise<void>;
}
