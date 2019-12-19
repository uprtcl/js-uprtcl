import gql from 'graphql-tag';

import { Hashed, CortexTypes, PatternRecognizer, ServiceProvider } from '@uprtcl/cortex';

import { Permissions } from './properties/permissions';
import { AccessControlService } from './services/access-control.service';
import { Updatable } from './properties/updatable';

export const accessControlTypes = gql`
  extend type Patterns {
    accessControl: AccessControl
  }

  type AccessControl {
    canWrite: Boolean!
    info: EntityType!
  }
`;

export const accessControlResolvers = {
  Patterns: {
    async accessControl(parent, args, context) {
      const entity: Hashed<any> = parent.__entity;
      const recognizer: PatternRecognizer = context.container.get(CortexTypes.Recognizer);

      const updatable: Updatable<any> | undefined = recognizer.recognizeUniqueProperty(
        entity,
        prop => !!(prop as Updatable<any, any>).update
      );

      if (!updatable) return null;

      const accessControl = updatable.accessControl(entity);

      if (!accessControl) return null;

      const accessControlInfo: any | undefined = await accessControl.getAccessControlInformation(
        entity.id
      );

      if (!accessControlInfo) return null;

      const permissions: Permissions<any> | undefined = recognizer.recognizeUniqueProperty(
        accessControlInfo,
        prop => !!(prop as Permissions<any>).canWrite
      );

      if (!permissions) return null;

      const serviceProvider: ServiceProvider = context.container.get(updatable.origin(entity));

      const userId = serviceProvider.userId;

      return {
        canWrite: permissions.canWrite(accessControlInfo)(userId),
        info: accessControlInfo
      };
    }
  }
};
