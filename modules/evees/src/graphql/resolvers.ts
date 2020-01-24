import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Pattern, Creatable, Signed } from '@uprtcl/cortex';
import { Secured } from '../patterns/default-secured.pattern';

import { Commit, Perspective } from '../types';
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

      const remote = evees.getPerspectiveProvider(parent);
      const details = await remote.getPerspectiveDetails(parent.id);

      return details && details.headId;
    },
    async name(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);
      const details = await remote.getPerspectiveDetails(parent.id);

      return details && details.name;
    },
    async context(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);
      const details = await remote.getPerspectiveDetails(parent.id);

      return details && details.context;
    }
  },
  Mutation: {
    async createCommit(_, { dataId, parentsIds, message, source }, { container }) {
      const patterns: Pattern[] = container.getAll(EveesBindings.CommitPattern);

      const creatable: Creatable<any, Signed<Commit>> | undefined = patterns.find(
        p => ((p as unknown) as Creatable<any, Signed<Commit>>).create
      ) as Creatable<any, Signed<Commit>> | undefined;

      if (!creatable) throw new Error(`No creatable pattern registered for perspectives`);

      const commit: Secured<Commit> = await creatable.create()(
        { dataId, parentsIds, message },
        source
      );

      return { id: commit.id, ...commit.object };
    },
    async updatePerspectiveHead(parent, { perspectiveId, headId }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      const provider = await evees.getPerspectiveProviderById(perspectiveId);
      await provider.updatePerspectiveDetails(perspectiveId, { headId });

      const perspective = await discovery.get(perspectiveId);

      if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

      return { id: perspective.id, ...perspective.object };
    },
    async createPerspective(_, { headId, context, name, authority }, { container }) {
      const patterns: Pattern[] = container.getAll(EveesBindings.PerspectivePattern);

      const creatable: Creatable<any, Signed<Perspective>> | undefined = patterns.find(
        p => ((p as unknown) as Creatable<any, Signed<Perspective>>).create
      ) as Creatable<any, Signed<Perspective>> | undefined;

      if (!creatable) throw new Error(`No creatable pattern registered for perspectives`);

      const perspective: Secured<Perspective> = await creatable.create()(
        { name, headId, context },
        authority
      );

      return { id: perspective.id, ...perspective.object, head: headId };
    }
  }
};
