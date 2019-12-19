import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';

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

  canWrite = (entity: OwnerAccessControl) => (userId: string | undefined): boolean => {
    return !!userId && entity.owner === userId;
  };
}
