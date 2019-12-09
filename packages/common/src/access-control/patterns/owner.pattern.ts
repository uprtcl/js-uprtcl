import { injectable } from 'inversify';

import { Pattern, UplAuth } from '@uprtcl/cortex';

import { Permissions } from '../properties/permissions';
import { OwnerAccessControl } from '../services/owner-access-control.service';

@injectable()
export class OwnerPattern implements Pattern, Permissions<OwnerAccessControl> {
  recognize = (entity: any) => {
    return (
      (entity as OwnerAccessControl).owner !== null &&
      typeof (entity as OwnerAccessControl).owner === 'string'
    );
  };

  canWrite = (entity: OwnerAccessControl) => (uplAuth: UplAuth): boolean => {
    return uplAuth.isAuthenticated && entity.owner === uplAuth.userId;
  };
}
