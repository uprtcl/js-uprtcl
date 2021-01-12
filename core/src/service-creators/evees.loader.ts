import { RemoteEvees } from '../services/remote.evees';
import { EveesConfig } from '../types';
import { CASStore } from '../cas/interfaces/cas-store';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { buildStore } from './build.store';
import { buildRecognizer } from './build.recognizer';
import { registerComponents } from './register.components';
import { buildEvees } from './build.evees';
import { CASRemote } from '../cas/interfaces/cas-remote';

/** a top level wrapper that registers everything */
export const eveesLoader = (
  remotes: Array<RemoteEvees>,
  stores: CASRemote[],
  modules: EveesContentModule[],
  config?: EveesConfig
): void => {
  const store = buildStore(stores);
  const recognizer = buildRecognizer(modules);
  const evees = buildEvees(remotes, store, recognizer, config, modules);
  registerComponents(evees);
};
