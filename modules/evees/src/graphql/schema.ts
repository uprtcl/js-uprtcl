import { gql } from 'apollo-boost';

export const eveesTypeDefs = gql`
  scalar Date

  extend type Mutation {
    updatePerspectiveHead(perspectiveId: ID!, headId: ID!): Perspective!
    createCommit(dataId: ID!, parentsIds: [ID!]!, message: String, source: String): Commit!
    createPerspective(headId: ID, context: String, authority: String, recursive: Boolean): Perspective!
  }

  type Context {
    identifier: String!
    perspectives: [Perspective!] @discover
  }

  type Commit implements Entity {
    id: ID!

    parentCommits: [Commit!]! @discover
    timestamp: Date!
    message: String
    data: Entity @discover

    _context: EntityContext!
  }

  type Perspective implements Entity {
    id: ID!

    head: Commit @discover
    name: String
    context: Context
    payload: Payload

    _context: EntityContext!
  }

  type Payload {
    origin: String
    creatorId: String
    timestamp: Date
  }
`;
