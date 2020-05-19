import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

export const eveesTypeDefs: DocumentNode = gql`
  scalar Date

  extend type Mutation {
    updatePerspectiveHead(
      perspectiveId: ID!
      headId: ID
      context: String
      name: String
    ): Perspective!

    createEntity(object: JSON!, casID: ID): Entity!

    createCommit(
      dataId: ID!
      parentsIds: [ID!]!
      creatorsIds: [String]
      message: String
      casID: String!
      timestamp: Date
    ): Commit!

    createPerspective(
      authority: String!
      creatorId: String
      timestamp: Date
      headId: ID
      context: String!
      name: String
      canWrite: String
      parentId: String
    ): Perspective!

    deletePerspective(perspectiveId: ID!): Perspective!

    addProposal(
      toPerspectiveId: ID!
      fromPerspectiveId: ID!
      toHeadId: ID!
      fromHeadId: ID!
      updateRequests: [HeadUpdateInput!]
    ): UpdateProposal!

    createAndAddProposal(
      perspectives: [NewPerspectiveInput]
      proposal: ProposalInput
    ): UpdateProposal!

    authorizeProposal(proposalId: ID!, perspectiveId: ID!, authorize: Boolean!): UpdateProposal!

    executeProposal(proposalId: ID!, perspectiveId: ID!): UpdateProposal!
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

  input PerspectivePayload {
    authority: String
    timestamp: Float
    creatorId: String
  }

  input PerspectiveEntityInput {
    proof: ProofInput
    payload: PerspectivePayload
  }

  input PerspectiveInput {
    id: String
    object: PerspectiveEntityInput
    casID: String
  }

  input PerspectiveDetailsInput {
    context: String
    name: String
    headId: String
  }

  input NewPerspectiveInput {
    perspective: PerspectiveInput
    details: PerspectiveDetailsInput
    canWrite: String
    parentId: String
  }

  input ProposalInput {
    toPerspectiveId: String!
    fromPerspectiveId: String!
    toHeadId: String!
    fromHeadId: String!
    updates: [HeadUpdateInput!]
  }

  type UpdateProposal {
    id: ID!

    creatorId: String
    toPerspective: Perspective! @discover
    fromPerspective: Perspective! @discover
    toHead: Commit! @discover
    fromHead: Commit! @discover
    updates: [HeadUpdate!]
    authorized: Boolean
    canAuthorize: Boolean
    executed: Boolean
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
    context: Context
    payload: Payload
    proposals: [UpdateProposal!]

    _context: EntityContext!
  }

  type Payload {
    authority: String
    creatorId: String
    timestamp: Date
  }
`;
