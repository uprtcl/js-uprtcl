// Required by inversify
import 'reflect-metadata';

// Default patterns
export { CidHashedPattern, recognizeHashed } from './patterns/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/default-secured.pattern';

/** Utils */
export { createEntity } from './utils/entities';
export { sortObject } from './utils/utils';

/** GraphQl */
export { ApolloClientModule } from './graphql/apollo-client.module';
export { GraphQlSchemaModule } from './graphql/graphql-schema.module';
export { baseTypeDefs } from './graphql/base-schema';
export { baseResolvers } from './graphql/base-resolvers';

/** Modules */
export { GqlDiscoveryModule } from './discovery/gql-discovery.module';
export { GqlCortexModule } from './cortex/gql-cortex.module';

export { CorePatterns } from './bindings';
