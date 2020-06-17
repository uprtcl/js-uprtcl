import { Behaviour } from '@uprtcl/cortex';

import { AccessControlService } from '../services/access-control.service';
import { Remote } from '../types/remote';

export interface Updatable<T> extends Behaviour<T> {
  accessControl: (entity: T) => AccessControlService<any> | undefined;

  remote: (entity: T) => Remote;
}
