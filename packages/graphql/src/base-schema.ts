import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const baseTypeDefs: DocumentNode = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }
`;
