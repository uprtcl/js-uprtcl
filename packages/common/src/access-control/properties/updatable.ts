import { Property } from '@uprtcl/cortex';

import { AccessControlService } from '../services/access-control.service';

export interface Updatable<T, C = any> extends Property<T> {
  /**
   * @returns whether the entity needs to be reloaded or not
   */
  update: (entity: T) => (newContent: C) => Promise<boolean>;

  accessControl: (entity: T) => AccessControlService<any> | undefined;

  origin: (entity: T) => string;
}
