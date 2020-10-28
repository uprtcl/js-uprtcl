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
import { EveesHelpers } from './evees.helpers';
import { EveesWorkspace } from '../services/evees.workspace';
import { GET_PERSPECTIVE_CONTEXTS } from './queries';

const getContextPerspectives = async (context, container) => {
  if (context === undefined) return [];

  const eveesRemotes: EveesRemote[] = container.getAll(EveesBindings.EveesRemote);
  const knownSources: KnownSourcesService = container.get(
    DiscoveryModule.bindings.LocalKnownSources
  );

  const promises = eveesRemotes.map(async remote => {
    const thisPerspectivesIds = await remote.getContextPerspectives(context);
    thisPerspectivesIds.forEach(pId => {
      knownSources.addKnownSources(pId, [remote.store.casID], EveesBindings.PerspectiveType);
    });
    return thisPerspectivesIds;
  });

  const perspectivesIdsPerRemote = await Promise.all(promises);

  const perspectivesIds = ([] as string[]).concat(...perspectivesIdsPerRemote);
  // remove duplicates
  const map = new Map<string, null>();
  perspectivesIds.forEach(id => map.set(id, null));
  return Array.from(map, key => key[0]);
};

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
      const context = typeof parent === 'string' ? parent : parent.id;
      return getContextPerspectives(context, container);
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
      return {
        remote: parent.payload.remote,
        path: parent.payload.path,
        creatorId: parent.payload.creatorId,
        timestamp: parent.payload.timestamp,
        context: {
          id: parent.payload.context
        }
      };
    },
    async canWrite(parent, _, { container }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const remote = evees.getPerspectiveProvider(parent);
      return remote.canWrite(parent.id);
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

    async deletePerspective(parent, { perspectiveId }, { container, cache }) {
      const evees: Evees = container.get(EveesBindings.Evees);
      const remote = await evees.getPerspectiveRemoteById(perspectiveId);
      await remote.deletePerspective(perspectiveId);

      /** we need to remove the perspective from the cache.
       * this code is based on
       * https://www.apollographql.com/docs/tutorial/local-state/ */
      const queryResult = cache.readQuery({
        query: GET_PERSPECTIVE_CONTEXTS(perspectiveId)
      });

      const entity = { ...queryResult.entity };

      /** remove this perspective from the perspectives array */
      entity.payload.context.perspectives = [
        ...entity.payload.context.perspectives.filter(persp => persp.id !== perspectiveId)
      ];

      /** overwrite cache */
      cache.writeQuery({
        query: GET_PERSPECTIVE_CONTEXTS(perspectiveId),
        data: entity
      });

      return { id: perspectiveId };
    },

    async createEntity(_, { id, object, casID }, { container }) {
      const stores: CASStore[] = container.getAll(CASModule.bindings.CASStore);
      const store = stores.find(d => d.casID === casID);

      if (!store) throw new Error(`No store registered for casID ${casID}`);
      const newId = await store.create(object, id);

      const entity: Entity<any> = {
        id: newId,
        object,
        casID
      };

      if (id !== undefined) {
        if (id !== newId) {
          throw new Error(
            `Unexpected id ${newId} for object ${JSON.stringify(object)}, expected ${id}`
          );
        }
      }

      const entityCache: EntityCache = container.get(DiscoveryModule.bindings.EntityCache);
      entityCache.cacheEntity(entity);

      return {
        id: newId,
        ...object
      };
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
        parentId,
        fromPerspectiveId,
        fromHeadId
      },
      { container }
    ) {
      const remotes = container.getAll(EveesBindings.EveesRemote);
      const remoteInstance: EveesRemote = remotes.find(instance => instance.id === remote);

      const perspective = await EveesHelpers.snapDefaultPerspective(
        remoteInstance,
        creatorId,
        context,
        timestamp,
        path,
        fromPerspectiveId,
        fromHeadId
      );

      const entityCache: EntityCache = container.get(DiscoveryModule.bindings.EntityCache);
      entityCache.cacheEntity({
        ...perspective,
        casID: remoteInstance.store.casID
      });

      const newPerspectiveData: NewPerspectiveData = {
        perspective,
        details: { headId, name },
        parentId
      };
      await remoteInstance.createPerspective(newPerspectiveData);
      return {
        id: perspective.id,
        name: name,
        head: headId,
        payload: perspective.object.payload
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
  },
  Query: {
    async contextPerspectives(parent, { context }, { container }) {
      return getContextPerspectives(context, container);
    }
  }
};
