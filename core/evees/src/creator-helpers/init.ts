import { ClientRemote } from '../evees/interfaces/client.remote';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { initRecognizer } from './init.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { Evees } from '../evees/evees.service';
import { RemoteRouter } from '../evees/clients/client.router';
import { ClientMutationLocal } from '../evees/clients/local/client.mutation.local';
import { ClientMutationMemory } from '../evees/clients/memory/mutation.memory';
import { ClientCacheStoreMemory } from '../evees/clients/memory/client.cache.store.memory';
import { ClientCache } from '../evees/clients/base/client.cache';
import { RouterEntityResolver } from '../evees/clients/entities/router.entity.resolver';
import { EntityRemote } from '../evees/interfaces/entity.remote';
import { EntityResolverBase } from '../evees/clients/entities/entity.resolver.base';
import { defaultConfig } from './config.merger';

/** a top level wrapper that registers everything */
export const init = (
  clientRemotes: ClientRemote[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  const recognizer = initRecognizer(modules, patterns);

  const clientToEntityRemotesMap = new Map<string, string>();
  clientRemotes.forEach((remote) => {
    clientToEntityRemotesMap.set(remote.id, remote.entityRemote.id);
  });

  /** extract all unique entity remotes */
  const entitiesRemotesMap = new Map<string, EntityRemote>();
  clientRemotes.forEach((remote) =>
    entitiesRemotesMap.set(remote.entityRemote.id, remote.entityRemote)
  );
  const entityRemotes = Array.from(entitiesRemotesMap.values());

  const entityRouter = new RouterEntityResolver(entityRemotes, clientToEntityRemotesMap);
  const entityResolver = new EntityResolverBase(entityRouter);

  const clientRouter = new RemoteRouter(clientRemotes, entityResolver);

  const memoryCache = new ClientCacheStoreMemory();
  const clientCache = new ClientCache(clientRouter, memoryCache, entityResolver);

  const cached = new ClientMutationLocal(clientCache, entityResolver);
  const onMemory = new ClientMutationMemory(cached);

  const mergedConfig = defaultConfig(clientRemotes, config);

  const evees = new Evees(
    onMemory,
    entityResolver,
    recognizer,
    clientRemotes,
    mergedConfig,
    modules
  );

  return evees;
};
