import { initRecognizer } from './init.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { Evees } from '../evees/evees.service';

import { defaultConfig } from './config.merger';

import { initEntityResolver } from './init.entity.resolver';

import {
  EntityRemoteLocal,
  RemoteRouter,
  ClientCacheStoreMemory,
  ClientMutationLocal,
  ClientMutationMemory,
  ClientCache,
} from '../evees/clients';
import {
  Client,
  ClientAndExplore,
  ClientRemote,
  EntityResolver,
  EveesConfig,
  EveesContentModule,
} from '../evees/interfaces';

/** a top level wrapper that registers everything */
export const initDefaultClientStack = (
  clientRemotes: ClientRemote[],
  entityResolverIn?: EntityResolver,
  modules?: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  const entityResolver = entityResolverIn || initEntityResolver(clientRemotes);

  let lastClient: ClientAndExplore;

  if (clientRemotes.length > 1) {
    // add router
    lastClient = new RemoteRouter(clientRemotes, entityResolver, true);
  } else {
    lastClient = clientRemotes[0];
  }

  const memoryCache = new ClientCacheStoreMemory();
  const clientCache = new ClientCache(
    lastClient,
    memoryCache,
    entityResolver,
    clientRemotes.length > 1 ? false : true
  );

  const entityCacheLocal = new EntityRemoteLocal();
  const cached = new ClientMutationLocal(clientCache, entityResolver, entityCacheLocal);
  const onMemory = new ClientMutationMemory(cached);

  const mergedConfig = defaultConfig(clientRemotes, config);

  const recognizer = initRecognizer(modules, patterns);

  const evees = new Evees(
    onMemory,
    entityResolver,
    recognizer,
    clientRemotes,
    mergedConfig,
    modules ? modules : new Map()
  );

  return evees;
};
