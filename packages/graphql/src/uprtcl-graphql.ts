// Required by inversify
import 'reflect-metadata';
import { ApolloClient, gql } from 'apollo-boost';

/** GraphQl */
export { ApolloClientModule } from './apollo-client.module';
export { GraphQlSchemaModule } from './graphql-schema.module';
export { baseTypeDefs } from './base-schema';
export { baseResolvers } from './base-resolvers';
export { NamedDirective } from './types';
export { ApolloClient };
export { gql };
