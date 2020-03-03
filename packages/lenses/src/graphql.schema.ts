import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const lensesSchema: DocumentNode = gql`
  scalar Function

  extend type Patterns {
    lenses: [Lens!]
    actions: [Action!]
  }

  type Lens {
    name: String!
    render: Function!
    type: String
  }

  type Action {
    icon: String!
    title: String!
    action: Function!
    type: String
  }
`;
