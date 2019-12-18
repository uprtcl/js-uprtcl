import { injectable } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { patternsModule } from '@uprtcl/cortex';

import { graphQlSchemaModule } from '../graphql/graphql-schema.module';
import { accessControlResolvers, accessControlTypes } from './graphql';
import { AccessControlTypes } from '../types';
import { OwnerPattern } from './patterns/owner.pattern';

@injectable()
export class AccessControlModule implements MicroModule {
  submodules = [
    graphQlSchemaModule(accessControlTypes, accessControlResolvers),
    patternsModule({
      [AccessControlTypes.OwnerPattern]: [OwnerPattern]
    })
  ];
}
