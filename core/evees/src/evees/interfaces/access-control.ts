import { Lens } from '../../patterns/behaviours/has-lenses';

export interface AccessControl {
  canUpdate(uref: string, userId?: string): Promise<boolean>;
  lense?(): Lens;
}
