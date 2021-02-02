import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { buildStore } from './build.store';
import { buildRecognizer } from './build.recognizer';
import { Pattern } from '../patterns/interfaces/pattern';
import { buildEvees } from './build.evees';
import { CASRemote } from '../cas/interfaces/cas-remote';
import { Evees } from '../evees/evees.service';
import { registerComponents } from './register.components';

/** a top level wrapper that registers everything */
export const eveesConstructorHelper = (
  remotes: Array<RemoteEvees>,
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
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

  const recognizer = buildRecognizer(modules, patterns);
  const evees = buildEvees(remotes, store, recognizer, modules, config);
  registerComponents(evees);

  return evees;
};
