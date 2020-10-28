import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

export const eveesTypeDefs: DocumentNode = gql`
  scalar Date

  extend type Mutation {
    updatePerspectiveHead(perspectiveId: ID!, headId: ID, name: String): Perspective!

    createEntity(id: String, object: JSON!, casID: ID): Entity!

    createPerspective(
      remote: String!
      path: String
      creatorId: String
      timestamp: Date
      headId: ID
      context: String
      name: String
      parentId: String
      fromPerspectiveId: String
      fromHeadId: String
    ): Perspective!

    forkPerspective(
      perspectiveId: ID!
      remote: String
      parentId: String
      name: String
    ): Perspective!

    deletePerspective(perspectiveId: ID!): Perspective!

    addProposal(
      toPerspectiveId: ID!
      fromPerspectiveId: ID!
      toHeadId: ID
      fromHeadId: ID
      newPerspectives: [NewPerspectiveInput!]
      updates: [HeadUpdateInput!]
    ): UpdateProposal!

    executeProposal(proposalId: ID!, perspectiveId: ID!): UpdateProposal!
  }

  extend type Query {
    contextPerspectives(context: String!): [Perspective!]
  }

  type Context {
    id: String!
    perspectives: [Perspective!] @discover
  }

  type HeadUpdate {
    fromPerspective: Perspective! @discover
    oldHead: Commit! @discover
    toPerspective: Perspective! @discover
    newHead: Commit! @discover
  }

  # Exact match to UpdateRequest typescript type
  input HeadUpdateInput {
    fromPerspectiveId: String
    oldHeadId: String
    perspectiveId: String
    newHeadId: String
  }

  input ProofInput {
    signature: String
    type: String
  }

  input PerspectivePayloadInput {
    remote: String
    path: String
    timestamp: Float
    creatorId: String
    context: String
    fromPerspectiveId: String
    fromHeadId: String
  }

  input PerspectiveEntityInput {
    proof: ProofInput
    payload: PerspectivePayloadInput
  }

  input PerspectiveInput {
    id: String
    object: PerspectiveEntityInput
    casID: String
  }

  input PerspectiveDetailsInput {
    name: String
    headId: String
  }

  input NewPerspectiveInput {
    perspective: PerspectiveInput
    details: PerspectiveDetailsInput
    parentId: String
  }

  input ProposalInput {
    toPerspectiveId: String!
    fromPerspectiveId: String!
    toHeadId: String!
    fromHeadId: String!
    newPerspectives: [NewPerspectiveInput!]
    updates: [HeadUpdateInput!]
  }

  type NewPerspective {
    perspective: Perspective
    details: PerspectiveDetails
    parentId: String
  }

  type PerspectiveDetails {
    name: String
    headId: String
  }

  type UpdateProposal {
    id: ID!

    creatorId: String
    toPerspective: Perspective! @discover
    fromPerspective: Perspective! @discover
    toHead: Commit! @discover
    fromHead: Commit! @discover
    newPerspectives: [NewPerspective!]
    updates: [HeadUpdate!]
  }

  type Commit implements Entity {
    id: ID!

    parentCommits: [Commit!]! @discover
    timestamp: Date!
    message: String
    data: Entity @discover
    creatorsIds: [ID!]!

    _context: EntityContext!
  }

  type Perspective implements Entity {
    id: ID!

    head: Commit @discover
    name: String
    payload: Payload
    proposals: [String!]
    canWrite: Boolean

    _context: EntityContext!
  }

  type Payload {
    remote: String
    path: String
    creatorId: String
    timestamp: Date
    context: Context
    fromPerspectiveId: String
    fromHeadId: String
  }
`;
