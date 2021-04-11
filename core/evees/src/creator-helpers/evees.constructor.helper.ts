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

  const store = buildStore(stores, remoteToSourcesMap);

  /** set the cached store of the remotes */
  remotes.forEach((remote) => {
    remote.setStore(store);
  });

  const recognizer = buildRecognizer(modules, patterns);
  const evees = buildEvees(remotes, stores, store, recognizer, modules, config);
  registerComponents(evees);

  return evees;
};
