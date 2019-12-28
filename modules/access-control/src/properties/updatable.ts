import { Property } from '@uprtcl/cortex';

import { AccessControlService } from '../services/access-control.service';

export interface Updatable<T, C = any> extends Property<T> {

  update: (entity: T) => (newContent: C) => Promise<void>;

  accessControl: (entity: T) => AccessControlService<any> | undefined;

  origin: (entity: T) => string;
}
