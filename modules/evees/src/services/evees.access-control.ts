import { Lens } from '@uprtcl/lenses';

export interface AccessControlService {
  canWrite(uref: string, userId?: string): Promise<boolean>;
  lense(): Lens;
}
