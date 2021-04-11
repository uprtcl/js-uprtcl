import { Lens } from '../../../../evees-ui/src/behaviours/has-lenses';

export interface AccessControlWithUi extends AccessControl {
  lense?(): Lens;
}
