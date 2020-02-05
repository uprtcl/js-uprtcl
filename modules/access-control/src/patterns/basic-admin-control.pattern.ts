import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

import { Permissions } from '../properties/permissions';
import { BasicAdminAccessControl } from '../services/basic-admin-control.service';

@injectable()
export class BasicAdminPattern implements Pattern, HasLenses, Permissions<BasicAdminAccessControl> {
  recognize = (entity: any) => {
    return (
      (entity as BasicAdminAccessControl).publicWrite !== undefined &&
      (entity as BasicAdminAccessControl).publicRead !== undefined &&
      (entity as BasicAdminAccessControl).canAdmin !== undefined &&
      (entity as BasicAdminAccessControl).canRead !== undefined &&
      (entity as BasicAdminAccessControl).canWrite !== undefined
    );
  };

  canWrite = (entity: BasicAdminAccessControl) => (userId: string | undefined): boolean => {
    return true;
  };

  lenses = (entity: BasicAdminAccessControl) => [
    {
      name: 'basic-admin-access-control',
      type: 'permissions',
      render: (_, context: any) =>
        html`
          <h1>TBD</h1>
        `
    }
  ];
}
