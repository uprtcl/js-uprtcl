// Required by inversify
import 'reflect-metadata';

/** Types */
export { AccessControlTypes, GraphQlTypes } from './types';

/** Access Control */
export { Updatable } from './access-control/properties/updatable';
export { Permissions } from './access-control/properties/permissions';

export { AccessControlModule } from './access-control';
export { AccessControlService } from './access-control/services/access-control.service';
export {
  OwnerAccessControl,
  OwnerAccessControlService
} from './access-control/services/owner-access-control.service';
export {
  BasicAdminAccessControl,
  BasicAdminAccessControlService
} from './access-control/services/basic-admin-control.service';

// Default patterns
export { CidHashedPattern, recognizeHashed } from './patterns/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/default-secured.pattern';

/** Utils */
export { sortObject } from './utils/utils';

/** GraphQl */
export { ApolloClientModule } from './graphql/apollo-client.module';
export { graphQlSchemaModule, GraphQlSchemaModule } from './graphql/graphql-schema.module';
export { baseTypeDefs, baseResolvers } from './graphql/base-schema';

/** i18n */
export { i18nextBaseModule } from './i18n/i18next-base.module';
export { i18nextModule, i18nModule } from './i18n/i18next.module';
