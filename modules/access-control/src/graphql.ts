import gql from 'graphql-tag';

import { Hashed, PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { Authority } from '@uprtcl/multiplatform';

import { Permissions } from './properties/permissions';
import { Updatable } from './properties/updatable';

export const accessControlTypes = gql`
  extend type Patterns {
    accessControl: AccessControl
  }

  type AccessControl {
    canWrite: Boolean!
    permissions: JSON!
  }
`;

export const accessControlResolvers = {
  Patterns: {
    async accessControl(parent, args, context) {
      const entity: Hashed<any> = parent.__entity;
      const recognizer: PatternRecognizer = context.container.get(CortexModule.bindings.Recognizer);

      const updatable: Updatable<any> | undefined = recognizer
        .recognize(entity)
        .find(prop => !!(prop as Updatable<any>).accessControl);

      if (!updatable) return null;

      const accessControl = updatable.accessControl(entity);

      if (!accessControl) return null;

      const permissions: any | undefined = await accessControl.getPermissions(entity.id);

      if (!permissions) return null;

      const permissionsPattern: Permissions<any> | undefined = recognizer
        .recognize(permissions)
        .find(prop => !!(prop as Permissions<any>).canWrite);

      if (!permissionsPattern) return null;

      const serviceProvider: Authority = updatable.authority(entity);

      const userId = serviceProvider.userId;

      return {
        canWrite: permissionsPattern.canWrite(permissions)(userId),
        permissions
      };
    }
  }
};
