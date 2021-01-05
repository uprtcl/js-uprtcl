import { Lens } from '@uprtcl/lenses';

export interface AccessControl {
  canUpdate(uref: string, userId?: string): Promise<boolean>;
  lense(): Lens;
}
