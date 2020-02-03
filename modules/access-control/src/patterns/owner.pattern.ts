import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

import { Permissions } from '../properties/permissions';
import { OwnerPermissions } from '../services/owner-access-control.service';

@injectable()
export class OwnerPattern implements Pattern, HasLenses, Permissions<OwnerPermissions> {
  recognize = (entity: any) => {
    return (
      (entity as OwnerPermissions).owner !== null &&
      typeof (entity as OwnerPermissions).owner === 'string'
    );
  };

  canWrite = (entity: OwnerPermissions) => (userId: string | undefined): boolean => {
    return !!userId && entity.owner === userId;
  };

  lenses = (entity: OwnerPermissions) => [
    {
      name: 'owner-access-control',
      type: 'permissions',
      render: (_, context: any) =>
        html`
          <permissions-owner
            .permissions=${entity}
            .canWrite=${context.canWrite}
            .entityId=${context.entityId}
          ></permissions-owner>
        `
    }
  ];
}
