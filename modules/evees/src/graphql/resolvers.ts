import { ApolloClient, gql } from 'apollo-boost';
import { IResolvers } from 'graphql-tools';

import {
  MultiSourceService,
  DiscoveryModule,
  CASStore,
  CASModule,
  KnownSourcesSource,
  EntityCache,
  KnownSourcesService,
} from '@uprtcl/multiplatform';
import { Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Commit, Perspective, NewProposal, NewPerspectiveData } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { ProposalsProvider } from '../services/proposals.provider';
import { EveesRemote } from '../services/evees.remote';
import { Secured } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';

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
    },
  },
  Context: {
    id(parent) {
      return typeof parent === 'string' ? parent : parent.context;
    },
    async perspectives(parent, _, { container }) {
      const context = typeof parent === 'string' ? parent : parent.context;

      if (context === undefined) return [];

      const evees: Evees = container.get(EveesBindings.Evees);
      const eveesRemotes: EveesRemote[] = container.getAll(
        EveesBindings.EveesRemote
      );
      const knownSources: KnownSourcesService = container.get(
        DiscoveryModule.bindings.LocalKnownSources
      );

      const promises = eveesRemotes.map(async (instance) => {
        const thisPerspectivesIds = await instance.getContextPerspectives(
          context
        );
        thisPerspectivesIds.forEach((pId) => {
          knownSources.addKnownSources(
            pId,
            [instance.store.casID],
            EveesBindings.PerspectiveType
          );
        });
        return thisPerspectivesIds;
      });

      const perspectivesIds = await Promise.all(promises);

      return ([] as string[]).concat(...perspectivesIds);
    },
  },
  UpdateProposal: {
    toPerspective(parent) {
      return parent.toPerspectiveId;
    },
    fromPerspective(parent) {
      return parent.fromPerspectiveId;
    },
    toHead(parent) {
      return parent.toPerspectiveId;
    },
    fromHead(parent) {
      return parent.fromPerspectiveId;
    },
  },
  HeadUpdate: {
    toPerspective(parent) {
      return parent.perspectiveId;
    },
    fromPerspective(parent) {
      return parent.fromPerspectiveId;
    },
    newHead(parent) {
      return parent.newHeadId;
    },
    oldHead(parent) {
      return parent.oldHeadId;
    },
  },
  Perspective: {
    async head(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);
      const details = await remote.getPerspective(parent.id);

      return details && details.headId;
    },
    async name(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);
      const details = await remote.getPerspective(parent.id);

      return details && details.name;
    },
    async context(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);

      const details = await remote.getPerspective(parent.id);

      return details && details.context;
    },
    async proposals(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);

      if (!remote.proposals) return [];

      const proposalsIds = await remote.proposals.getProposalsToPerspective(
        parent.id
      );
      const proposalsPromises = proposalsIds.map((proposalId) => {
        return (remote.proposals as ProposalsProvider).getProposal(proposalId);
      });

      const proposals = await Promise.all(proposalsPromises);

      return proposals;
    },
  },
  Mutation: {
    async updatePerspectiveHead(
      parent,
      { perspectiveId, headId, context, name },
      { container }
    ) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const multiSource: MultiSourceService = container.get(
        DiscoveryModule.bindings.MultiSourceService
      );
      const client: ApolloClient<any> = container.get(
        ApolloClientModule.bindings.Client
      );

      const provider = await evees.getPerspectiveRemoteById(perspectiveId);

      await provider.updatePerspective(perspectiveId, {
        headId,
        context,
        name,
      });
      /** needed to return the current values in case one of the inputs is undefined */
      const detailsRead = await provider.getPerspective(perspectiveId);

      if (((provider as unknown) as KnownSourcesSource).knownSources) {
        await multiSource.postEntityUpdate(
          (provider as unknown) as KnownSourcesSource,
          [headId]
        );
      }

      const result = await client.query({
        query: gql`{
        entity(uref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`,
      });

      const perspective = result.data.entity._context.object;

      if (!perspective)
        throw new Error(`Perspective with id ${perspectiveId} not found`);

      return {
        id: perspectiveId,
        ...perspective,
        head: {
          id: detailsRead.headId,
        },
        context: {
          id: detailsRead.context,
        },
        name: detailsRead.name,
      };
    },

    async deletePerspective(parent, { perspectiveId }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const remote = await evees.getPerspectiveRemoteById(perspectiveId);
      await remote.deletePerspective(perspectiveId);
      return { id: perspectiveId };
    },

    async createEntity(_, { object, casID }, { container }) {
      const stores: CASStore[] = container.getAll(CASModule.bindings.CASStore);
      const store = stores.find((d) => d.casID === casID);

      if (!store) throw new Error(`No store registered for casID ${casID}`);
      const id = await store.create(object);

      const entity: Entity<any> = {
        id,
        object,
        casID,
      };

      const entityCache: EntityCache = container.get(
        DiscoveryModule.bindings.EntityCache
      );
      entityCache.cacheEntity(entity);

      return { id, ...object };
    },

    async createPerspective(
      _,
      {
        remote,
        path,
        creatorId,
        timestamp,
        headId,
        context,
        name,
        canWrite,
        parentId,
      },
      { container }
    ) {
      const remotes = container.getAll(EveesBindings.EveesRemote);

      const remoteInstance: EveesRemote = remotes.find(
        (instance) => instance.id === remote
      );

      path = path !== undefined ? path : remoteInstance.defaultPath;

      creatorId =
        creatorId !== undefined
          ? creatorId
          : remoteInstance.userId !== undefined
          ? remoteInstance.userId
          : '';
      timestamp = timestamp !== undefined ? timestamp : Date.now();
      name = name !== undefined && name != null ? name : '';

      const payload: Perspective = {
        creatorId,
        remote,
        path,
        timestamp,
      };

      const perspective: Secured<Perspective> = await deriveSecured(
        payload,
        remoteInstance.store.cidConfig
      );

      const entityCache: EntityCache = container.get(
        DiscoveryModule.bindings.EntityCache
      );
      entityCache.cacheEntity({
        ...perspective,
        casID: remoteInstance.store.casID,
      });

      const newPerspectiveData: NewPerspectiveData = {
        perspective,
        details: { headId, name, context },
        canWrite,
        parentId,
      };
      await remoteInstance.createPerspective(newPerspectiveData);

      return {
        id: perspective.id,
        name: name,
        head: headId,
        context: context,
        payload: payload,
      };
    },

    async createAndAddProposal(_, { perspectives, proposal }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = await evees.getPerspectiveRemoteById(
        proposal.toPerspectiveId
      );
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      const proposalId = await remote.proposals.createAndPropose(
        perspectives,
        proposal
      );

      return {
        id: proposalId,
        toPerspectiveId: proposal.toPerspectiveId,
        fromPerspectiveId: proposal.fromPerspectiveId,
        updates: proposal.updates,
        authorized: false,
        canAuthorize: false,
        executed: false,
      };
    },

    async addProposal(
      _,
      {
        toPerspectiveId,
        fromPerspectiveId,
        toHeadId,
        fromHeadId,
        updateRequests,
      },
      { container }
    ) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = await evees.getPerspectiveRemoteById(toPerspectiveId);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      const proposal: NewProposal = {
        fromPerspectiveId,
        toPerspectiveId,
        fromHeadId,
        toHeadId,
        updates: updateRequests,
      };
      const proposalId = await remote.proposals.createProposal(proposal);

      return {
        id: proposalId,
        toPerspectiveId,
        fromPerspectiveId,
        updates: updateRequests,
        authorized: false,
        canAuthorize: false,
        executed: false,
      };
    },

    async authorizeProposal(
      _,
      { proposalId, perspectiveId, authorize },
      { container }
    ) {
      const client: ApolloClient<any> = container.get(
        ApolloClientModule.bindings.Client
      );
      const evees: Evees = container.get(EveesBindings.Evees);

      const perspectiveResult = await client.query({
        query: gql`{
        entity(uref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`,
      });

      const perspective = perspectiveResult.data.entity._context.object;

      const remote = evees.getRemote(perspective.payload.remote);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      if (authorize) {
        await remote.proposals.acceptProposal(proposalId);
      } else {
        await remote.proposals.declineProposal(proposalId);
      }

      const proposalRead = await remote.proposals.getProposal(proposalId);

      return {
        id: proposalId,
        authorized: authorize,
        executed:
          proposalRead.executed !== undefined ? proposalRead.executed : false,
        toPerspectiveId: perspectiveId,
      };
    },
    async executeProposal(_, { proposalId, perspectiveId }, { container }) {
      const client: ApolloClient<any> = container.get(
        ApolloClientModule.bindings.Client
      );
      const evees: Evees = container.get(EveesBindings.Evees);

      const perspectiveResult = await client.query({
        query: gql`{
        entity(uref: "${perspectiveId}") {
          id
          _context {
            object
          }
        }
      }`,
      });

      const perspective = perspectiveResult.data.entity._context.object;

      const remote = evees.getRemote(perspective.payload.remote);
      if (!remote.proposals) throw new Error('remote cant handle proposals');

      await remote.proposals.executeProposal(proposalId);

      return {
        id: proposalId,
        toPerspectiveId: perspectiveId,
        executed: true,
      };
    },
  },
};
