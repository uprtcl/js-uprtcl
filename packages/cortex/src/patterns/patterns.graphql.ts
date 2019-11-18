import { gql, ApolloClient, InMemoryCache } from 'apollo-boost';
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import { GraphQLSchema } from 'graphql';
import { SchemaLink } from 'apollo-link-schema';

export const cortexTypeDefs = gql`
  scalar JSON

  type Query {
    entity(id: String, depth: Int = 1, autoRedirect: Boolean = true): Entity!
  }

  type Entity {
    id: String!
    object: JSON!
    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]
  }
`;

const resolvers = {
  Query: {
    entity(parent, args, context, info) {
      return { id: 'i', object: args.id, patterns: { links: [] } };
    }
  }
};

export const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs: cortexTypeDefs,
  resolvers
});
