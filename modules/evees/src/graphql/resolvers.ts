import { ApolloClient, gql } from 'apollo-boost';
import { IResolvers } from 'graphql-tools';

import {
  MultiSourceService,
  DiscoveryModule,
  CASStore,
  CASModule,
  KnownSourcesSource
} from '@uprtcl/multiplatform';
import { Entity, Signed } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Commit, Perspective } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { ProposalsProvider } from '../services/proposals.provider';
import { EveesRemote } from '../services/evees.remote';
import { NewPerspectiveData } from '../services/evees.provider';
import { Secured, hashObject } from '../utils/cid-hash';
import { signObject } from 'src/utils/signed';

export const eveesResolvers: IResolvers = {
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
    },
    creatorsIds(parent) {
      return parent.payload.creatorsIds;
    }
  },
  Context: {
    id(parent) {
      return typeof parent === 'string' ? parent : parent.context;
    },
    async perspectives(parent, _, { container }) {
      const context = typeof parent === 'string' ? parent : parent.context;

      const evees: Evees = container.get(EveesBindings.Evees);

      return evees.getContextPerspectives(context);
    }
  },
  UpdateProposal: {
    toPerspective(parent) {
      return parent.toPerspectiveId;
    },
    fromPerspective(parent) {
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
      const proposalsPromises = proposalsIds.map(proposalId => {
        return (remote.proposals as ProposalsProvider).getProposal(proposalId);
      });

      const proposals = await Promise.all(proposalsPromises);

      return proposals;
    }
  },
  Mutation: {
    async createCommit(
      _,
      { creatorsIds, dataId, parentsIds, message, source, timestamp },
      { container }
    ) {
      const remotes: EveesRemote[] = container.getAll(EveesBindings.EveesRemote);
      const multiSource: MultiSourceService = container.get(
        DiscoveryModule.bindings.MultiSourceService
      );
      const remote: EveesRemote | undefined= remotes.find(r => r.casID === source);

      if (!remote) throw new Error(`Evees Remote with casID was not registered ${source}`)

      const commitData: Commit = {
        creatorsIds: creatorsIds,
        dataId: dataId,
        message: message,
        timestamp: timestamp,
        parentsIds: parentsIds
      };

      const signed: Signed<Commit> = signObject(commitData);
      const commitId: string = await hashObject(signed, remote.cidConfig);

      const commit: Secured<Commit> = {
        id: commitId,
        entity: signed,
        casID: remote.casID
      }

      await remote.cloneCommit(commit);
      await multiSource.postEntityCreate(commit);

      return {
        id: commit.id,
        ...commit.entity
      };
    },

    async updatePerspectiveHead(parent, { perspectiveId, headId, context, name }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const multiSource: MultiSourceService = container.get(
        DiscoveryModule.bindings.MultiSourceService
      );
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);

      const provider = await evees.getPerspectiveProviderById(perspectiveId);

      await provider.updatePerspectiveDetails(perspectiveId, { headId, context, name });
      /** needed to return the current values in case one of the inputs is undefined */
      const detailsRead = await provider.getPerspectiveDetails(perspectiveId);

      if (((provider as unknown) as KnownSourcesSource).knownSources) {
        await multiSource.postEntityUpdate((provider as unknown) as KnownSourcesSource, [headId]);
      }

      const result = await client.query({
        query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`
      });

      const perspective = result.data.entity._context.object;

      if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

      return {
        id: perspectiveId,
        ...perspective,
        head: {
          id: detailsRead.headId
        },
        context: {
          id: detailsRead.context
        },
        name: detailsRead.name
      };
    },

    async deletePerspective(parent, { perspectiveId }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const remote = await evees.getPerspectiveProviderById(perspectiveId);
      await remote.deletePerspective(perspectiveId);
      return { id: perspectiveId };
    },

    async createPerspective(
      _,
      { creatorId, origin, timestamp, headId, context, name, authority, canWrite, parentId },
      { container }
    ) {
      const remotes = container.getAll(EveesBindings.EveesRemote);

      const remote: EveesRemote = remotes.find(remote => remote.authority === authority);

      const perspectiveData: Perspective = {
        creatorId,
        origin,
        timestamp
      };
      const signed: Signed<Perspective> = signObject(perspectiveData);
      const perspectiveId: string = await hashObject(signed, remote.cidConfig);
      const perspective: Secured<Perspective> = {
        id: perspectiveId,
        entity: signed,
        casID: remote.casID
      };

      const newPerspectiveData: NewPerspectiveData = {
        perspective,
        details: { headId, name, context },
        canWrite,
        parentId
      };
      await remote.cloneAndInitPerspective(newPerspectiveData);

      return {
        id: perspective.id,
        name: name,
        head: headId,
        context: context,
        payload: {
          creatorId,
          origin,
          timestamp
        }
      };
    },

    async addProposal(_, { toPerspectiveId, fromPerspectiveId, updateRequests }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = await evees.getPerspectiveProviderById(toPerspectiveId);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      const proposalId = await remote.proposals.createProposal(
        fromPerspectiveId,
        toPerspectiveId,
        updateRequests
      );

      return {
        id: proposalId,
        toPerspectiveId: toPerspectiveId,
        fromPerspectiveId: fromPerspectiveId,
        updates: updateRequests,
        authorized: false,
        canAuthorize: false,
        executed: false
      };
    },

    async authorizeProposal(_, { proposalId, perspectiveId, authorize }, { container }) {
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);
      const evees: Evees = container.get(EveesBindings.Evees);

      const perspectiveResult = await client.query({
        query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`
      });

      const perspective = perspectiveResult.data.entity._context.object;

      const remote = evees.getAuthority(perspective.payload.origin);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      if (authorize) {
        await remote.proposals.acceptProposal(proposalId);
      } else {
        await remote.proposals.declineProposal(proposalId);
      }

      return {
        id: proposalId,
        authorized: authorize
      };
    },
    async executeProposal(_, { proposalId, perspectiveId }, { container }) {
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);
      const evees: Evees = container.get(EveesBindings.Evees);

      const perspectiveResult = await client.query({
        query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`
      });

      const perspective = perspectiveResult.data.entity._context.object;

      const remote = evees.getAuthority(perspective.payload.origin);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      await remote.proposals.executeProposal(proposalId);

      return {
        id: proposalId,
        toPerspectiveId: perspectiveId,
        executed: true
      };
    }
  }
};

export const contentCreateResolver = async (content, source, container) => {
  const stores: CASStore[] = container.getAll(CASModule.bindings.CASStore);

  const store = stores.find(d => d.casID === source);

  if (!store) throw new Error(`No store registered for source ${source}`);

  const id = await store.create(content);

  return { id, ...content };
};
