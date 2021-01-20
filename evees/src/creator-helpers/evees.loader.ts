import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { buildStore } from './build.store';
import { buildRecognizer } from './build.recognizer';
import { registerComponents } from './register.components';
import { buildEvees } from './build.evees';
import { CASRemote } from '../cas/interfaces/cas-remote';

/** a top level wrapper that registers everything */
export const eveesLoader = (
  remotes: Array<RemoteEvees>,
  modules: Map<string, EveesContentModule>,
  config?: EveesConfig
): void => {
  /** extract the stores and map remotes to stores */
  const remoteToSourcesMap = new Map<string, string>();
  const stores = new Map<string, CASRemote>();
  remotes.forEach((remote) => {
    stores.set(remote.storeRemote.casID, remote.storeRemote);
    remoteToSourcesMap.set(remote.id, remote.storeRemote.casID);
  });

  const store = buildStore(stores, remoteToSourcesMap);

  /** set the cached store of the remotes */
  remotes.forEach((remote) => {
    remote.setStore(store);
  });

  const recognizer = buildRecognizer(modules);
  const evees = buildEvees(remotes, store, recognizer, modules, config);
  registerComponents(evees);
};
