import {
  DiscoveryService,
  DiscoveryModule,
  TaskQueue,
  Task,
  EntityCache
} from '@uprtcl/multiplatform';
import { Pattern, Creatable, Signed, IsSecure } from '@uprtcl/cortex';
import { Secured } from '../patterns/default-secured.pattern';

import { Commit, Perspective } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { ProposalsProvider } from '../services/proposals.provider';
import { ApolloClient, gql } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesRemote } from 'src/services/evees.remote';

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
  UpdateProposal: {
    toPerspective (parent) {
      return parent.toPerspectiveId;
    },
    fromPerspective (parent) {
      return parent.fromPerspectiveId;
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
    },
    async proposals(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);
      
      if (!remote.proposals) return [];
      
      const proposalsIds = await remote.proposals.getProposalsToPerspective(parent.id);
      const proposalsPromises = proposalsIds.map((proposalId) => {
        return (remote.proposals as ProposalsProvider).getProposal(proposalId)
      });

      const proposals = await Promise.all(proposalsPromises);

      return proposals;
    }
  },
  Mutation: {
    async createCommit(_, { creatorsIds, dataId, parentsIds, message, source, timestamp }, { container }) {
      
      const remotes = container.get(EveesBindings.EveesRemote);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);
      const secured: IsSecure<any> = container.get(EveesBindings.Secured);

      const commitData: Commit = {
        creatorsIds: creatorsIds,
        dataId: dataId,
        message: message,
        timestamp: timestamp,
        parentsIds: parentsIds
      };
      
      const commit: Secured<Commit> = await secured.derive()(commitData);
      const remote: EveesRemote = remotes.find(r => r.source === source);

      await remote.cloneCommit(commit);
        await discovery.postEntityCreate(remote, commit);

      return { id: commit.id, ...commit.object };
    },

    async updatePerspectiveHead(parent, { perspectiveId, headId }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);
      
      const provider = await evees.getPerspectiveProviderById(perspectiveId);

      await provider.updatePerspectiveDetails(perspectiveId, { headId });
      
      await discovery.postEntityUpdate(provider, [headId]);

      const result = await client.query({
        query: gql`{
        entity(id: "${perspectiveId}") {
          id
          _context {
            raw
          }
        }
      }`
      });

      const perspective = JSON.parse(result.data.entity._context.raw);

      if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

      return { id: perspectiveId, ...perspective, head: { id: headId } };
    },

    async createPerspective(_, { creatorId, origin, timestamp, headId, context, name, authority, canWrite }, { container }) {
      const remotes = container.get(EveesBindings.EveesRemote);
      const secured: IsSecure<any> = container.get(EveesBindings.Secured);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      const remote: EveesRemote = remotes.find(remote => remote.authority === authority);

      const perspectiveData: Perspective = {
        creatorId,
        origin,
        timestamp
      };
      const perspective: Secured<Perspective> = await secured.derive()(perspectiveData);

      await remote.cloneAndInitPerspective(perspective, { headId, name, context }, canWrite);
      await discovery.postEntityCreate(remote, perspective);

      return { id: perspective.id, ...perspective.object, head: headId };
    }
  }
};
