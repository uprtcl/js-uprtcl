import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { initStore } from './init.store';
import { initRecognizer } from './init.recognizer';
import { initEvees } from './init.evees';
import { Pattern } from '../patterns/interfaces/pattern';
import { CASRemote } from '../cas/interfaces/cas-remote';
import { Evees } from '../evees/evees.service';

/** a top level wrapper that registers everything */
export const init = (
  remotes: RemoteEvees[],
  stores: CASRemote[],
  modules: Map<string, EveesContentModule>,
  patterns?: Pattern<any>[],
  config?: EveesConfig
): Evees => {
  /** extract the stores and map remotes to stores */
  const remoteToSourcesMap = new Map<string, string>();
  remotes.forEach((remote) => {
    remoteToSourcesMap.set(remote.id, remote.casID);
  });

  const store = initStore(stores, remoteToSourcesMap);

  /** set the cached store of the remotes */
  remotes.forEach((remote) => {
    remote.setStore(store);
  });

  const recognizer = initRecognizer(modules, patterns);
  const evees = initEvees(remotes, stores, store, recognizer, modules, config);
  
  return evees;
};
