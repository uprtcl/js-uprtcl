import { Signed } from '../../../patterns';
import { AccessControl, EntityResolver, Perspective } from '../../interfaces';
import { LOCAL_REMOTE_ID } from './client.remote.local';

export class LocalAccessControl implements AccessControl {
  constructor(protected entityResolver: EntityResolver) {}

  async canUpdate(uref: string, userId?: string): Promise<boolean> {
    const perspective = await this.entityResolver.getEntity<Signed<Perspective>>(uref);
    return perspective.object.payload.remote === LOCAL_REMOTE_ID;
  }
}
