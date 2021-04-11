import { Lens } from '../../../../evees-ui/src/behaviours/has-lenses';

export interface AccessControl {
  canUpdate(uref: string, userId?: string): Promise<boolean>;
  lense?(): Lens;
}
