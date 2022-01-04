import { Signed } from '../../../patterns';
import { AccessControl, EntityResolver, Perspective } from '../../interfaces';

export const LOCAL_REMOTE_ID = 'local';

export class LocalAccessControl implements AccessControl {
  constructor(protected entityResolver: EntityResolver) {}

  async canUpdate(uref: string, userId?: string): Promise<boolean> {
    const perspective = await this.entityResolver.getEntity<Signed<Perspective>>(uref);
    return perspective.object.payload.remote === LOCAL_REMOTE_ID;
  }
}
