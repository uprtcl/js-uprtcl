import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

import { Permissions } from '../behaviours/permissions';
import { OwnerPermissions } from '../services/owner-access-control.service';

export class OwnerPattern extends Pattern<OwnerPermissions> {
  recognize = (permissions: any) => {
    return permissions.type === 'owner';
  };

  type = 'OwnerPermissions';
}

@injectable()
export class OwnerBehaviour implements HasLenses<OwnerPermissions>, Permissions<OwnerPermissions> {
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
        `,
    },
  ];
}
