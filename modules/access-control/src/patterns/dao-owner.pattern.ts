import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

import { Permissions } from '../behaviours/permissions';
import { DAOPermissions } from 'src/services/dao-access-control.service';

export class DaoOwnerPattern extends Pattern<DAOPermissions> {
  recognize = (permissions: DAOPermissions) => {
    return permissions.type === 'dao';
  };

  type = 'DaoOwnerPermissions';
}

@injectable()
export class DaoOwnerBehaviour implements HasLenses<DAOPermissions>, Permissions<DAOPermissions> {
  canWrite = (entity: DAOPermissions) => (userId: string | undefined): boolean => {
    return false;
  };

  lenses = (entity: DAOPermissions) => [
    {
      name: 'dao-owner-access-control',
      type: 'permissions',
      render: (_, context: any) =>
        html`
          <permissions-dao
            .permissions=${entity}
            entityId=${context.entityId}
          ></permissions-dao>
          `,
    },
  ];
}
