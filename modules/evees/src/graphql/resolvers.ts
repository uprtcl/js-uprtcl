import { Secured } from '@uprtcl/common';

import { Commit } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';

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
    },
    data(parent) {
      return parent.payload.dataId;
    }
  },
  Context: {
    identifier(parent) {
      return typeof parent === 'string' ? parent : parent.context;
    },
    async perspectives(parent, _, { container }) {
      const context = typeof parent === 'string' ? parent : parent.context;

      const evees: Evees = container.get(EveesBindings.Evees);

      return evees.getContextPerspectives(context);
    }
  },
  Perspective: {
    async head(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const details = await evees.getPerspectiveDetails(parent.id);

      console.log('head', details.headId);

      return details && details.headId;
    },
    async name(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const details = await evees.getPerspectiveDetails(parent.id);

      return details && details.name;
    },
    async context(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const details = await evees.getPerspectiveDetails(parent.id);

      return details && details.context;
    }
  },
  Mutation: {
    async createCommit(_, { dataId, parentsIds, message, usl }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const commit: Secured<Commit> = await evees.createCommit(
        { dataId, parentsIds, message },
        usl
      );

      return { id: commit.id, ...commit.object };
    },
    async updatePerspectiveHead(parent, { perspectiveId, headId }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      await evees.updatePerspectiveDetails(perspectiveId, { headId });

      const perspective = await evees.get(perspectiveId);

      if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

      return { id: perspective.id, ...perspective.object };
    },
    async createPerspective(_, { headId, context, usl }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const hashedPerspective = await evees.createPerspective({ headId, context }, usl);

      return { id: hashedPerspective.id, ...hashedPerspective.object };
    }
  }
};
