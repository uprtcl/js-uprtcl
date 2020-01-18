import { gql } from 'apollo-boost';


export const eveesTypeDefs = gql`
  scalar Date

  extend type Mutation {
    updatePerspectiveHead(perspectiveId: ID!, headId: ID!): Perspective!
    createCommit(dataId: ID!, parentsIds: [ID!]!, message: String, usl: String): Commit!
    createPerspective(headId: ID, context: String, authority: String): Perspective!
  }

  type Context {
    identifier: String!
    perspectives: [Perspective!]
  }

  type Commit implements Entity {
    id: ID!

    parentCommits: [Commit!]!
    timestamp: Date!
    message: String
    data: Entity @discover

    _patterns: Patterns!
  }

  type Perspective implements Entity {
    id: ID!

    head: Commit @discover
    name: String
    context: Context
    payload: Payload

    _patterns: Patterns!
  }

  type Payload {
    origin: String
    creatorId: String
    timestamp: Date
  }
`;
