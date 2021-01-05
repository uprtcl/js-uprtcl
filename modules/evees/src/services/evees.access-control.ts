import { Lens } from '@uprtcl/lenses';

export interface AccessControlService {
  canUpdate(uref: string, userId?: string): Promise<boolean>;
  lense(): Lens;
}
