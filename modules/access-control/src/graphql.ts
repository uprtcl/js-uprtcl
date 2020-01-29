import gql from 'graphql-tag';

import { Hashed, PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { Authority } from '@uprtcl/multiplatform';

import { AccessControl } from './properties/access-control';

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

      const accessControl: AccessControl<any> | undefined = recognizer
        .recognize(entity)
        .find(prop => !!(prop as AccessControl<any>).canWrite);

      if (!accessControl) return null;

      return {
        canWrite: accessControl.canWrite(entity)
      };
    }
  }
};
