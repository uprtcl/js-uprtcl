import { Property } from '@uprtcl/cortex';
import { Authority } from '@uprtcl/multiplatform';

import { AccessControlService } from '../services/access-control.service';

export interface Updatable<T> extends Property<T> {
  accessControl: (entity: T) => AccessControlService<any> | undefined;

  authority: (entity: T) => Authority;
}
