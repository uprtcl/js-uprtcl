import { Hashed, PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { DiscoveryModule, EntityCache, DiscoveryService } from '@uprtcl/multiplatform';
import { Authority } from '@uprtcl/multiplatform';

import { Permissions } from '../properties/permissions';
import { Updatable } from '../properties/updatable';
import { OwnerAccessControlService } from 'src/services/owner-access-control.service';
import { AccessControlService } from '../services/access-control.service';

export const accessControlResolvers = {
  Mutation: {
    async setCanWrite(_, { entityId, userId }, { container }) {
      // const entityCache: EntityCache = container.get(DiscoveryModule.bindings.EntityCache);
      // const entity = entityCache.getCachedEntity(entityId);
      const discoveryService: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);
      const entity: any = await discoveryService.get(entityId);

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

      if (!entity) throw new Error(`Cannot change owner of ${entityId}: entity not found`);

      const updatable: Updatable<any> | undefined = recognizer
        .recognize(entity)
        .find(prop => !!(prop as Updatable<any>).accessControl);

      if (!updatable)
        throw new Error(`Cannot change owner of ${entityId}: no Updatable pattern implemented`);

      const accessControl: AccessControlService<any> | undefined = updatable.accessControl(entity);

      if (!accessControl)
        throw new Error(
          `Cannot set canWrite of ${entityId}: no AccessControlService associated with this entity`
        );

      await accessControl.setCanWrite(entityId, userId);

      return entityId;
    }
  },
  Patterns: {
    async accessControl(parent, args, context) {
      const entity: Hashed<any> = parent.__entity;
      const recognizer: PatternRecognizer = context.container.get(CortexModule.bindings.Recognizer);

      const hasAccessControl: Updatable<any> | undefined = recognizer
        .recognize(entity)
        .find(prop => !!(prop as Updatable<any>).accessControl);

      if (!hasAccessControl) return null;

      const accessControl = hasAccessControl.accessControl(entity);

      if (!accessControl) return null;

      const permissions: any | undefined = await accessControl.getPermissions(entity.id);

      if (!permissions) return null;

      const permissionsPattern: Permissions<any> | undefined = recognizer
        .recognize(permissions)
        .find(prop => !!(prop as Permissions<any>).canWrite);

      if (!permissionsPattern) return null;

      const serviceProvider: Authority = hasAccessControl.authority(entity);

      const userId = serviceProvider.userId;

      return {
        canWrite: permissionsPattern.canWrite(permissions)(userId),
        permissions
      };
    }
  }
};
