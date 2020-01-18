import { gql } from 'apollo-boost';

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
  }
`;

export const accessControlResolvers = {
  Patterns: {
    async accessControl(parent, args, context) {
      const entity: Hashed<any> = parent.__entity;
      const recognizer: PatternRecognizer = context.container.get(CortexModule.bindings.Recognizer);

      const updatable: Updatable<any> | undefined = recognizer
        .recognize(entity)
        .find(prop => !!(prop as Updatable<any, any>).update);

      if (!updatable) return null;

      const accessControl = updatable.accessControl(entity);

      if (!accessControl) return null;

      const accessControlInfo: any | undefined = await accessControl.getAccessControlInformation(
        entity.id
      );

      if (!accessControlInfo) return null;

      const permissions: Permissions<any> | undefined = recognizer
        .recognize(accessControlInfo)
        .find(prop => !!(prop as Permissions<any>).canWrite);

      if (!permissions) return null;

      const serviceProvider: Authority = context.container.get(updatable.origin(entity));

      const userId = serviceProvider.userId;

      return {
        canWrite: permissions.canWrite(accessControlInfo)(userId),
        info: accessControlInfo
      };
    }
  }
};
