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
  loadEntity
} from '@uprtcl/multiplatform';
import { Entity, Signed, CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective, NewProposal, NewPerspectiveData } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { EveesRemote } from '../services/evees.remote';
import { Secured } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';
import { EveesHelpers } from './evees.helpers';
import { EveesWorkspace } from '../services/evees.workspace';

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
      return typeof parent === 'string' ? parent : parent.id;
    },
    async perspectives(parent, _, { container }) {
      const context = typeof parent === 'string' ? parent : parent.context;

      if (context === undefined) return [];

      const eveesRemotes: EveesRemote[] = container.getAll(EveesBindings.EveesRemote);
      const knownSources: KnownSourcesService = container.get(
        DiscoveryModule.bindings.LocalKnownSources
      );

      const promises = eveesRemotes.map(async instance => {
        const thisPerspectivesIds = await instance.getContextPerspectives(context);
        thisPerspectivesIds.forEach(pId => {
          knownSources.addKnownSources(pId, [instance.store.casID], EveesBindings.PerspectiveType);
        });
        return thisPerspectivesIds;
      });

      const perspectivesIds = await Promise.all(promises);

      return ([] as string[]).concat(...perspectivesIds);
    }
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
    }
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
    }
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
    async proposals(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);

      const remote = evees.getPerspectiveProvider(parent);

      if (!remote.proposals) return [];

      return remote.proposals.getProposalsToPerspective(parent.id);
    },
    async payload(parent, _, { container }) {
      debugger;
      return {
        remote: parent.payload.remote,
        path: parent.payload.path,
        creatorId: parent.payload.creatorId,
        timestamp: parent.payload.timestamp,
        context: {
          id: parent.payload.context
        }
      };
    }
  },
  Mutation: {
    async updatePerspectiveHead(parent, { perspectiveId, headId, name }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const multiSource: MultiSourceService = container.get(
        DiscoveryModule.bindings.MultiSourceService
      );
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);

      const provider = await evees.getPerspectiveRemoteById(perspectiveId);

      await provider.updatePerspective(perspectiveId, {
        headId,
        name
      });
      /** needed to return the current values in case one of the inputs is undefined */
      const detailsRead = await provider.getPerspective(perspectiveId);

      if (((provider as unknown) as KnownSourcesSource).knownSources) {
        await multiSource.postEntityUpdate((provider as unknown) as KnownSourcesSource, [headId]);
      }

      const result = await client.query({
        query: gql`{
          entity(uref: "${perspectiveId}") {
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
        name: detailsRead.name
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
      const store = stores.find(d => d.casID === casID);

      if (!store) throw new Error(`No store registered for casID ${casID}`);
      const id = await store.create(object);

      const entity: Entity<any> = {
        id,
        object,
        casID
      };

      const entityCache: EntityCache = container.get(DiscoveryModule.bindings.EntityCache);
      entityCache.cacheEntity(entity);

      return { id, ...object };
    },

    async createPerspective(
      _,
      { remote, path, creatorId, timestamp, headId, context, name, canWrite, parentId },
      { container }
    ) {
      const remotes = container.getAll(EveesBindings.EveesRemote);

      const remoteInstance: EveesRemote = remotes.find(instance => instance.id === remote);

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
        context
      };

      const perspective: Secured<Perspective> = await deriveSecured(
        payload,
        remoteInstance.store.cidConfig
      );

      const entityCache: EntityCache = container.get(DiscoveryModule.bindings.EntityCache);
      entityCache.cacheEntity({
        ...perspective,
        casID: remoteInstance.store.casID
      });

      const newPerspectiveData: NewPerspectiveData = {
        perspective,
        details: { headId, name },
        canWrite,
        parentId
      };
      await remoteInstance.createPerspective(newPerspectiveData);
      return {
        id: perspective.id,
        name: name,
        head: headId,
        context: context,
        payload: payload
      };
    },

    async forkPerspective(_, { perspectiveId, remote, parentId, name }, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);
      const recognizer = container.get(CortexModule.bindings.Recognizer);

      const workspace = new EveesWorkspace(client, recognizer);
      const newPerspectiveId = await evees.forkPerspective(perspectiveId, workspace, remote);
      await workspace.execute(client);

      const headId = await EveesHelpers.getPerspectiveHeadId(client, newPerspectiveId);
      const perspective = await loadEntity<Signed<Perspective>>(client, newPerspectiveId);
      if (!perspective) throw new Error('perspective not found');

      return {
        id: newPerspectiveId,
        name: name,
        head: headId,
        payload: {
          remote: perspective.object.payload.remote,
          path: perspective.object.payload.path,
          creatorId: perspective.object.payload.creatorId,
          timestamp: perspective.object.payload.timestamp,
          context: {
            id: perspective.object.payload.context,
            perspectives: {
              newPerspectiveId
            }
          }
        }
      };
    },

    async addProposal(
      _,
      { toPerspectiveId, fromPerspectiveId, toHeadId, fromHeadId, newPerspectives, updates },
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
        details: {
          updates: updates,
          newPerspectives: newPerspectives
        }
      };
      const proposalId = await remote.proposals.createProposal(proposal);

      return {
        id: proposalId,
        toPerspectiveId,
        fromPerspectiveId,
        updates: updates,
        canExecute: false,
        executed: false
      };
    }
  }
};
