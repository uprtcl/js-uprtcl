import { Behaviour } from '@uprtcl/cortex';

import { AccessControlService } from '../services/access-control.service';
import { Authority } from '../types/authority';

export interface Updatable<T> extends Behaviour<T> {
  accessControl: (entity: T) => AccessControlService<any> | undefined;

  authority: (entity: T) => Authority;
}
