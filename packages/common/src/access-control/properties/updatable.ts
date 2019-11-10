import { AccessControlService } from '../services/access-control.service';

export interface Updatable<T = any> {
  /**
   * @returns whether the entity needs to be reloaded or not
   */
  update: (entity: any, newContent: T) => Promise<boolean>;

  accessControl: (entity: any) => AccessControlService<any> | undefined;
}
