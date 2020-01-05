import { gql } from 'apollo-boost';

import { Secured } from '@uprtcl/common';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';

export const eveesTypeDefs = gql`
  scalar Date

  extend type Mutation {
    updatePerspectiveHead(perspectiveId: ID!, headId: ID!): Perspective!
    createCommit(dataId: ID!, parentsIds: [ID!]!, message: String, usl: String): Commit!
    createPerspective(headId: ID, context: String, usl: String): Perspective!
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
    data: Entity

    _patterns: Patterns!
    _meta: Metadata!
  }

  type Perspective implements Entity {
    id: ID!

    head: Commit
    name: String
    context: Context
    payload: Payload

    _patterns: Patterns!
    _meta: Metadata!
  }

  type Payload {
    origin: String
    creatorId: String
    timestamp: Date
  }
`;

export const eveesResolvers = {
  Commit: {
    message(parent) {
      return parent.payload.message;
    },
    timestamp(parent) {
      return parent.payload.timestamp;
    },
    parentCommits(parent) {
      return parent.payload.parentsIds;
    }
  },
  Context: {
    identifier(parent) {
      return typeof parent === 'string' ? parent : parent.context;
    },
    async perspectives(parent, _, { container }) {
      const context = typeof parent === 'string' ? parent : parent.context;

      const evees: Evees = container.get(EveesTypes.Evees);

      return evees.getContextPerspectives(context);
    }
  },
  Perspective: {
    async head(parent, _, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      const details = await evees.getPerspectiveDetails(parent.__entity.id);

      return details && details.headId;
    },
    async name(parent, _, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      const details = await evees.getPerspectiveDetails(parent.__entity.id);

      return details && details.name;
    },
    async context(parent, _, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      const details = await evees.getPerspectiveDetails(parent.__entity.id);

      return details && details.context;
    }
  },
  Mutation: {
    async createCommit(_, { dataId, parentsIds, message, usl }, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      const commit: Secured<Commit> = await evees.createCommit(
        { dataId, parentsIds, message },
        usl
      );

      return { id: commit.id, ...commit.object };
    },
    async updatePerspectiveHead(parent, { perspectiveId, headId }, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      await evees.updatePerspectiveDetails(perspectiveId, { headId });

      const perspective = await evees.get(perspectiveId);

      if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

      return { id: perspective.id, ...perspective.object };
    },
    async createPerspective(_, { headId, context, usl }, { container }) {
      const evees: Evees = container.get(EveesTypes.Evees);

      const hashedPerspective = await evees.createPerspective({ headId, context }, usl);

      return { id: hashedPerspective.id, ...hashedPerspective.object };
    }
  }
};
