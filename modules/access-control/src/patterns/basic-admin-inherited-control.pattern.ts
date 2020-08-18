import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

import { Permissions } from '../behaviours/permissions';
import { BasicAdminPermissions, BasicAdminInheritedPermissions } from '../services/basic-admin-control.service';

export class BasicAdminInheritedPattern extends Pattern<BasicAdminInheritedPermissions> {
  recognize = (entity: any) => {
    console.log("BasicAdminInheritedPattern -> recognize -> entity", entity)
    return (
      entity.delegate !== undefined &&
      entity.delegateTo !== undefined &&
      entity.finDelegatedTo !== undefined &&

      (entity.customPermissions as BasicAdminPermissions).publicWrite !== undefined &&
      (entity.customPermissions as BasicAdminPermissions).publicRead !== undefined &&
      (entity.customPermissions as BasicAdminPermissions).canAdmin !== undefined &&
      (entity.customPermissions as BasicAdminPermissions).canRead !== undefined &&
      (entity.customPermissions as BasicAdminPermissions).canWrite !== undefined &&

      (entity.effectivePermissions as BasicAdminPermissions).publicWrite !== undefined &&
      (entity.effectivePermissions as BasicAdminPermissions).publicRead !== undefined &&
      (entity.effectivePermissions as BasicAdminPermissions).canAdmin !== undefined &&
      (entity.effectivePermissions as BasicAdminPermissions).canRead !== undefined &&
      (entity.effectivePermissions as BasicAdminPermissions).canWrite !== undefined
    );
  };

  type = undefined;
}

@injectable()
export class AdminInheritedBehaviour
  implements HasLenses<BasicAdminInheritedPermissions>, Permissions<BasicAdminInheritedPermissions> {
  canWrite = (entity: BasicAdminInheritedPermissions) => (userId: string | undefined): boolean => {
    if (entity.effectivePermissions.publicWrite) return true;
    if (!userId) return false;
    if (entity.effectivePermissions.canWrite.includes(userId)) return true;
    if (entity.effectivePermissions.canAdmin.includes(userId)) return true;
    return false;
  };

  lenses = (entity: BasicAdminInheritedPermissions) => {
    console.log("lenses -> entity", entity)
    return [
    {
      name: 'basic-admin-inherited-access-control',
      type: 'permissions',
      render: (_, context: any) =>
        html`
          <permissions-admin-inherited
            .permissions=${entity}
            .canWrite=${context.canWrite}
            .entityId=${context.entityId}
          ></permissions-admin-inherited>
        `,
    },
  ]};
}
